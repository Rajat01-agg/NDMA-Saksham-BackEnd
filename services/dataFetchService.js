const TrainingSession = require('../models/TrainingSession');
const District = require('../models/District');

const {
  subDays,
  subMonths,
  startOfYear,
  format,
} = require('date-fns');

class DataFetchService {
  /**
   * Main entry point - Fetches all report data
   * Used from report.js → dataFetchService.fetchReportData(type, filters, geoFilter)
   */
  async fetchReportData(reportType, filters = {}, userGeoFilter = {}) {
    try {
      console.log('📊 Fetching report data:', {
        reportType,
        filters: JSON.stringify(filters, null, 2),
        userGeoFilter: JSON.stringify(userGeoFilter, null, 2),
      });

      // 1) Build query (includes SDMA geo restriction)
      const query = this.buildQuery(filters, userGeoFilter);
      console.log('🔍 MongoDB Query:', JSON.stringify(query, null, 2));

      // 2) Fetch trainings with populated district & trainer
      const trainings = await TrainingSession.find(query)
        .populate('district_id', 'name state')
        .populate('trainer_id', 'firstName lastName email')
        .sort({ start_date: -1 })
        .lean();

      console.log(`✅ Found ${trainings.length} training sessions`);

      if (trainings.length === 0) {
        console.log('⚠️ No trainings found - returning empty data');
        return this.getEmptyReportData();
      }

      // 3) Calculate all analytics blocks
      console.log('📈 Calculating summary stats…');
      const summary = this.calculateSummary(trainings, filters);

      console.log('🌍 Calculating geographic breakdown…');
      const geographicBreakdown = this.calculateGeographicBreakdown(trainings);

      console.log('🎯 Calculating theme distribution…');
      const themeDistribution = this.calculateThemeDistribution(trainings);

      console.log('🏆 Calculating top performers…');
      const topPerformers = this.calculateTopPerformers(trainings);

      console.log('🔍 Calculating gaps…');
      const gaps = await this.calculateGaps(trainings, userGeoFilter);

      console.log('📊 Calculating monthly trends…');
      const monthlyTrends = this.calculateMonthlyTrends(trainings);

      console.log('🕒 Preparing recent trainings list…');
      const recentTrainings = this.buildRecentTrainings(trainings);

      console.log('✅ All calculations complete!');

      // Shape is aligned with pdfService (snake_case keys)
      return {
        summary,
        geographic_breakdown: geographicBreakdown,
        theme_distribution: themeDistribution,
        top_performers: topPerformers,
        gaps,
        monthly_trends: monthlyTrends,
        recent_trainings: recentTrainings,
      };
    } catch (error) {
      console.error('❌ Data fetch error:', error);
      throw error;
    }
  }

  /**
   * Build MongoDB query from filters + geographic restrictions
   */
  buildQuery(filters = {}, userGeoFilter = {}) {
    // Start with user's geographic filter (NDMA → {}, SDMA → restricted districts)
    const query = {
      ...(userGeoFilter || {}),
    };

    console.log(
      '🔒 Base query with geo filter:',
      JSON.stringify(query, null, 2)
    );

    // ---- Date range ----
    if (filters.date_range) {
      const dateRange = this.parseDateRange(filters.date_range);
      if (dateRange) {
        query.start_date = {
          $gte: dateRange.start,
          $lte: dateRange.end,
        };
        console.log('📅 Added date filter:', {
          start: dateRange.start.toISOString(),
          end: dateRange.end.toISOString(),
        });
      }
    }

    // ---- Training filters (theme, verification etc.) ----
    const trainingFilters = filters.training || {};

    // Theme filter
    if (Array.isArray(trainingFilters.themes) && trainingFilters.themes.length) {
      query.theme = { $in: trainingFilters.themes };
    }

    // Verification status (default: verified)
    if (
      trainingFilters.verification_status &&
      trainingFilters.verification_status !== 'all'
    ) {
      query.verification_status = trainingFilters.verification_status;
    } else {
      // By default, report should generally consider verified ones
      query.verification_status = 'verified';
    }

    // General status (optional)
    if (trainingFilters.status && trainingFilters.status !== 'all') {
      query.status = trainingFilters.status;
    }

    // ---- Specific targets (trainer / district) ----
    const targets = filters.specific_targets || {};

    if (Array.isArray(targets.trainer_ids) && targets.trainer_ids.length) {
      query.trainer_id = { $in: targets.trainer_ids };
    }

    if (Array.isArray(targets.district_ids) && targets.district_ids.length) {
      // Intersect with geoFilter if present
      if (userGeoFilter && userGeoFilter.district_id) {
        const allowed = userGeoFilter.district_id.$in || [];
        const intersection = targets.district_ids.filter((id) =>
          allowed.map(String).includes(String(id))
        );
        query.district_id = { $in: intersection };
      } else {
        query.district_id = { $in: targets.district_ids };
      }
    }

    console.log('🧮 Final query after filters:', JSON.stringify(query, null, 2));
    return query;
  }

  /**
   * Parses date range presets and custom ranges
   */
  parseDateRange(range = {}) {
    const now = new Date();
    let start;
    let end;

    const preset = range.preset || 'last_30_days';

    switch (preset) {
      case 'last_7_days':
        start = subDays(now, 7);
        end = now;
        break;
      case 'last_15_days':
        start = subDays(now, 15);
        end = now;
        break;
      case 'last_30_days':
        start = subDays(now, 30);
        end = now;
        break;
      case 'last_3_months':
        start = subMonths(now, 3);
        end = now;
        break;
      case 'last_6_months':
        start = subMonths(now, 6);
        end = now;
        break;
      case 'current_year':
        start = startOfYear(now);
        end = now;
        break;
      case 'custom':
        if (range.start && range.end) {
          start = new Date(range.start);
          end = new Date(range.end);
        }
        break;
      default:
        start = subDays(now, 30);
        end = now;
        break;
    }

    if (!start || !end || isNaN(start.getTime()) || isNaN(end.getTime())) {
      console.warn('⚠️ Invalid date range, returning null');
      return null;
    }

    // Normalize
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return { start, end };
  }

  /**
   * Summary block
   */
  calculateSummary(trainings, filters) {
    const totalTrainings = trainings.length;
    let totalParticipants = 0;

    const districtSet = new Set();
    const trainerSet = new Set();
    const dateList = [];

    trainings.forEach((t) => {
      const claimed =
        (t.attendance_validation &&
          t.attendance_validation.claimed_count) ||
        0;
      totalParticipants += claimed;

      if (t.district_id && t.district_id._id) {
        districtSet.add(String(t.district_id._id));
      }

      if (t.trainer_id && t.trainer_id._id) {
        trainerSet.add(String(t.trainer_id._id));
      }

      if (t.start_date) {
        const d = new Date(t.start_date);
        if (!isNaN(d.getTime())) dateList.push(d);
      }
    });

    let dateRangeCovered = null;
    if (dateList.length) {
      const minDate = new Date(Math.min(...dateList));
      const maxDate = new Date(Math.max(...dateList));
      dateRangeCovered = `${format(
        minDate,
        'dd MMM yyyy'
      )} - ${format(maxDate, 'dd MMM yyyy')}`;
    }

    const avgParticipants =
      totalTrainings > 0
        ? Math.round((totalParticipants / totalTrainings) * 10) / 10
        : 0;

    return {
      total_trainings: totalTrainings,
      total_participants: totalParticipants,
      unique_districts: districtSet.size,
      unique_trainers: trainerSet.size,
      avg_participants_per_training: avgParticipants,
      date_range_covered: dateRangeCovered,
      applied_filters: filters || {},
    };
  }

  /**
   * Geographic breakdown (by district)
   */
  calculateGeographicBreakdown(trainings) {
    const districtMap = {};

    trainings.forEach((t) => {
      const district = t.district_id;
      if (!district) return;

      const id = String(district._id);
      if (!districtMap[id]) {
        districtMap[id] = {
          district_name: district.name || 'Unknown',
          state: district.state || 'Unknown',
          training_count: 0,
          total_participants: 0,
        };
      }

      districtMap[id].training_count += 1;
      districtMap[id].total_participants +=
        (t.attendance_validation &&
          t.attendance_validation.claimed_count) ||
        0;
    });

    const result = Object.values(districtMap).sort(
      (a, b) => b.training_count - a.training_count
    );

    return result;
  }

  /**
   * Theme distribution
   */
  calculateThemeDistribution(trainings) {
    const themeMap = {};

    trainings.forEach((t) => {
      const theme = t.theme || 'general';
      if (!themeMap[theme]) {
        themeMap[theme] = {
          theme,
          training_count: 0,
          total_participants: 0,
        };
      }

      themeMap[theme].training_count += 1;
      themeMap[theme].total_participants +=
        (t.attendance_validation &&
          t.attendance_validation.claimed_count) ||
        0;
    });

    return Object.values(themeMap).sort(
      (a, b) => b.training_count - a.training_count
    );
  }

  /**
   * Top performers (districts + trainers)
   */
  calculateTopPerformers(trainings) {
    // Districts
    const districtMap = {};

    trainings.forEach((t) => {
      const d = t.district_id;
      if (!d) return;

      const id = String(d._id);
      if (!districtMap[id]) {
        districtMap[id] = {
          name: d.name || 'Unknown',
          state: d.state || 'Unknown',
          training_count: 0,
          total_participants: 0,
        };
      }

      districtMap[id].training_count += 1;
      districtMap[id].total_participants +=
        (t.attendance_validation &&
          t.attendance_validation.claimed_count) ||
        0;
    });

    const topDistricts = Object.values(districtMap)
      .sort((a, b) => b.training_count - a.training_count)
      .slice(0, 10);

    // Trainers
    const trainerMap = {};

    trainings.forEach((t) => {
      const tr = t.trainer_id;
      if (!tr) return;

      const id = String(tr._id);
      if (!trainerMap[id]) {
        trainerMap[id] = {
          name:
            `${tr.firstName || ''} ${tr.lastName || ''}`.trim() ||
            'Unknown',
          email: tr.email || 'N/A',
          sessions_conducted: 0,
          total_participants: 0,
        };
      }

      trainerMap[id].sessions_conducted += 1;
      trainerMap[id].total_participants +=
        (t.attendance_validation &&
          t.attendance_validation.claimed_count) ||
        0;
    });

    const topTrainers = Object.values(trainerMap)
      .sort((a, b) => b.sessions_conducted - a.sessions_conducted)
      .slice(0, 10);

    return {
      districts: topDistricts,
      trainers: topTrainers,
    };
  }

  /**
   * Gaps (zero trainings + inactive districts)
   */
  async calculateGaps(trainings, userGeoFilter = {}) {
    try {
      const now = new Date();
      const sixMonthsAgo = subMonths(now, 6);

      // Build district query from geoFilter
      const districtQuery = {};
      if (userGeoFilter.district_id) {
        const distFilter = userGeoFilter.district_id;
        if (distFilter.$in) {
          districtQuery._id = { $in: distFilter.$in };
        } else {
          districtQuery._id = distFilter;
        }
      }

      // All districts in scope
      const allDistricts = await District.find(districtQuery).lean();

      // Districts which have at least one training
      const districtsWithTraining = new Set(
        trainings
          .map((t) => t.district_id && t.district_id._id)
          .filter(Boolean)
          .map((id) => String(id))
      );

      // Districts with ZERO trainings
      const districtsWithZero = allDistricts
        .filter((d) => !districtsWithTraining.has(String(d._id)))
        .map((d) => ({
          name: d.name,
          state: d.state,
        }))
        .slice(0, 20);

      // Inactive districts (no training in 6+ months)
      const districtLastTraining = {};

      trainings.forEach((t) => {
        const d = t.district_id;
        if (!d) return;

        const id = String(d._id);
        const date = new Date(t.start_date);
        if (
          !districtLastTraining[id] ||
          date > districtLastTraining[id].date
        ) {
          districtLastTraining[id] = {
            name: d.name,
            state: d.state,
            date,
          };
        }
      });

      const inactiveDistricts = Object.values(districtLastTraining)
        .filter((d) => d.date < sixMonthsAgo)
        .map((d) => ({
          name: d.name,
          state: d.state,
          last_training_date: d.date,
          days_since_last: Math.floor(
            (now - d.date) / (1000 * 60 * 60 * 24)
          ),
        }))
        .sort((a, b) => b.days_since_last - a.days_since_last)
        .slice(0, 20);

      return {
        districts_with_zero_trainings: districtsWithZero,
        inactive_districts: inactiveDistricts,
      };
    } catch (err) {
      console.error('❌ Gap calculation error:', err);
      return {
        districts_with_zero_trainings: [],
        inactive_districts: [],
      };
    }
  }

  /**
   * Monthly trends
   */
  calculateMonthlyTrends(trainings) {
    const monthMap = {};

    trainings.forEach((t) => {
      if (!t.start_date) return;
      const d = new Date(t.start_date);
      if (isNaN(d.getTime())) return;

      const key = format(d, 'yyyy-MM'); // e.g., 2025-01
      if (!monthMap[key]) {
        monthMap[key] = {
          month: key,
          training_count: 0,
          total_participants: 0,
        };
      }

      monthMap[key].training_count += 1;
      monthMap[key].total_participants +=
        (t.attendance_validation &&
          t.attendance_validation.claimed_count) ||
        0;
    });

    return Object.values(monthMap).sort((a, b) =>
      a.month.localeCompare(b.month)
    );
  }

  /**
   * Recent trainings list for PDF footer/table
   */
  buildRecentTrainings(trainings) {
    return trainings.slice(0, 10).map((t) => ({
      session_code: t.session_code,
      theme: t.theme,
      district: t.district_id?.name || 'N/A',
      state: t.district_id?.state || 'N/A',
      trainer: t.trainer_id
        ? `${t.trainer_id.firstName || ''} ${
            t.trainer_id.lastName || ''
          }`.trim() || 'Unknown'
        : 'Unknown',
      participants:
        (t.attendance_validation &&
          t.attendance_validation.claimed_count) ||
        0,
      start_date: t.start_date,
      end_date: t.end_date,
      verification_status: t.verification_status,
      status: t.status,
    }));
  }

  /**
   * Default empty structure (keeps pdfService happy)
   */
  getEmptyReportData() {
    return {
      summary: {
        total_trainings: 0,
        total_participants: 0,
        unique_districts: 0,
        unique_trainers: 0,
        avg_participants_per_training: 0,
        date_range_covered: null,
        applied_filters: {},
      },
      geographic_breakdown: [],
      theme_distribution: [],
      top_performers: {
        districts: [],
        trainers: [],
      },
      gaps: {
        districts_with_zero_trainings: [],
        inactive_districts: [],
      },
      monthly_trends: [],
      recent_trainings: [],
    };
  }
}

module.exports = new DataFetchService();
