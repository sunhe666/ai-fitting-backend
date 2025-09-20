/**
 * 统计服务
 * 处理系统统计相关的业务逻辑
 */

const { SystemStats, User, TryonTask, Image } = require('../models');
const { Op } = require('sequelize');
const { sequelize } = require('../config/database-init');

class StatsService {
  /**
   * 获取实时统计数据
   * @returns {Object} 实时统计数据
   */
  async getRealTimeStats() {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const thisWeekStart = new Date(today);
      thisWeekStart.setDate(today.getDate() - today.getDay());
      
      const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

      // 并行查询各种统计数据
      const [
        totalUsers,
        todayUsers,
        weekUsers,
        monthUsers,
        totalTasks,
        todayTasks,
        weekTasks,
        monthTasks,
        totalImages,
        todayImages,
        taskStatusStats,
        taskModeStats,
        recentTasks
      ] = await Promise.all([
        // 用户统计
        User.count(),
        User.count({ where: { created_at: { [Op.gte]: today.toISOString().split('T')[0] } } }),
        User.count({ where: { created_at: { [Op.gte]: thisWeekStart } } }),
        User.count({ where: { created_at: { [Op.gte]: thisMonthStart } } }),
        
        // 任务统计
        TryonTask.count(),
        TryonTask.count({ where: { created_at: { [Op.gte]: today.toISOString().split('T')[0] } } }),
        TryonTask.count({ where: { created_at: { [Op.gte]: thisWeekStart } } }),
        TryonTask.count({ where: { created_at: { [Op.gte]: thisMonthStart } } }),
        
        // 图片统计
        Image.count(),
        Image.count({ where: { created_at: { [Op.gte]: today.toISOString().split('T')[0] } } }),
        
        // 任务状态统计
        TryonTask.findAll({
          attributes: [
            'task_status',
            [sequelize.fn('COUNT', '*'), 'count']
          ],
          group: ['task_status']
        }),
        
        // 任务模式统计
        TryonTask.findAll({
          attributes: [
            'tryon_mode',
            [sequelize.fn('COUNT', '*'), 'count']
          ],
          group: ['tryon_mode']
        }),
        
        // 最近任务
        TryonTask.findAll({
          limit: 10,
          order: [['created_at', 'DESC']],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'nickname']
            }
          ]
        })
      ]);

      // 计算成功率
      const successfulTasks = taskStatusStats.find(s => s.task_status === 'SUCCEEDED');
      const successRate = totalTasks > 0 ? 
        ((successfulTasks?.dataValues.count || 0) / totalTasks * 100).toFixed(2) : 0;

      // 格式化任务状态统计
      const statusStats = {
        pending: 0,
        processing: 0,
        succeeded: 0,
        failed: 0
      };
      
      taskStatusStats.forEach(stat => {
        const count = parseInt(stat.dataValues.count);
        switch (stat.task_status) {
          case 'PENDING':
            statusStats.pending = count;
            break;
          case 'PRE-PROCESSING':
          case 'RUNNING':
          case 'POST-PROCESSING':
            statusStats.processing += count;
            break;
          case 'SUCCEEDED':
            statusStats.succeeded = count;
            break;
          case 'FAILED':
            statusStats.failed = count;
            break;
        }
      });

      // 格式化试衣模式统计
      const modeStats = {
        top: 0,
        bottom: 0,
        outfit: 0,
        dress: 0
      };
      
      taskModeStats.forEach(stat => {
        modeStats[stat.tryon_mode] = parseInt(stat.dataValues.count);
      });

      return {
        overview: {
          totalUsers,
          totalTasks,
          totalImages,
          successRate: parseFloat(successRate)
        },
        users: {
          total: totalUsers,
          today: todayUsers,
          thisWeek: weekUsers,
          thisMonth: monthUsers
        },
        tasks: {
          total: totalTasks,
          today: todayTasks,
          thisWeek: weekTasks,
          thisMonth: monthTasks,
          statusStats,
          modeStats
        },
        images: {
          total: totalImages,
          today: todayImages
        },
        recentTasks: recentTasks.map(task => ({
          id: task.id,
          task_id: task.task_id,
          user_nickname: task.user?.nickname || '未知用户',
          tryon_mode: task.tryon_mode,
          task_status: task.task_status,
          created_at: task.created_at
        }))
      };
    } catch (error) {
      console.error('获取实时统计数据失败:', error);
      throw new Error(`获取实时统计数据失败: ${error.message}`);
    }
  }

  /**
   * 获取历史统计数据
   * @param {Object} options - 查询选项
   * @returns {Object} 历史统计数据
   */
  async getHistoryStats(options = {}) {
    try {
      const {
        stat_type = 'daily',
        start_date = null,
        end_date = null,
        limit = 30
      } = options;

      const whereClause = { stat_type };
      if (start_date && end_date) {
        whereClause.stat_date = {
          [Op.between]: [start_date, end_date]
        };
      }

      const stats = await SystemStats.findAll({
        where: whereClause,
        order: [['stat_date', 'DESC']],
        limit
      });

      return {
        stats: stats.reverse(), // 按时间正序返回
        summary: this.calculateStatsSummary(stats)
      };
    } catch (error) {
      console.error('获取历史统计数据失败:', error);
      throw new Error(`获取历史统计数据失败: ${error.message}`);
    }
  }

  /**
   * 生成统计数据
   * @param {string} statType - 统计类型
   * @param {Date} statDate - 统计日期
   * @returns {Object} 统计数据
   */
  async generateStats(statType = 'daily', statDate = new Date()) {
    try {
      const date = new Date(statDate);
      let startDate, endDate;

      // 根据统计类型确定时间范围
      switch (statType) {
        case 'daily':
          startDate = new Date(date);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(date);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'weekly':
          startDate = new Date(date);
          startDate.setDate(date.getDate() - date.getDay());
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 6);
          endDate.setHours(23, 59, 59, 999);
          break;
        case 'monthly':
          startDate = new Date(date.getFullYear(), date.getMonth(), 1);
          endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          endDate.setHours(23, 59, 59, 999);
          break;
        default:
          throw new Error('无效的统计类型');
      }

      // 查询统计数据
      const [
        totalUsers,
        newUsers,
        activeUsers,
        totalTasks,
        newTasks,
        completedTasks,
        failedTasks,
        topTasks,
        bottomTasks,
        outfitTasks,
        dressTasks,
        totalImages,
        newImages,
        avgProcessingTime
      ] = await Promise.all([
        User.count({ where: { created_at: { [Op.lte]: endDate } } }),
        User.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } }),
        User.count({
          where: {
            last_login_at: { [Op.between]: [startDate, endDate] }
          }
        }),
        TryonTask.count({ where: { created_at: { [Op.lte]: endDate } } }),
        TryonTask.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } }),
        TryonTask.count({
          where: {
            created_at: { [Op.between]: [startDate, endDate] },
            task_status: 'SUCCEEDED'
          }
        }),
        TryonTask.count({
          where: {
            created_at: { [Op.between]: [startDate, endDate] },
            task_status: 'FAILED'
          }
        }),
        TryonTask.count({
          where: {
            created_at: { [Op.between]: [startDate, endDate] },
            tryon_mode: 'top'
          }
        }),
        TryonTask.count({
          where: {
            created_at: { [Op.between]: [startDate, endDate] },
            tryon_mode: 'bottom'
          }
        }),
        TryonTask.count({
          where: {
            created_at: { [Op.between]: [startDate, endDate] },
            tryon_mode: 'outfit'
          }
        }),
        TryonTask.count({
          where: {
            created_at: { [Op.between]: [startDate, endDate] },
            tryon_mode: 'dress'
          }
        }),
        Image.count({ where: { created_at: { [Op.lte]: endDate } } }),
        Image.count({ where: { created_at: { [Op.between]: [startDate, endDate] } } }),
        TryonTask.findOne({
          attributes: [
            [sequelize.fn('AVG', 
              sequelize.literal('TIMESTAMPDIFF(SECOND, submit_time, end_time)')
            ), 'avg_time']
          ],
          where: {
            created_at: { [Op.between]: [startDate, endDate] },
            task_status: 'SUCCEEDED',
            submit_time: { [Op.not]: null },
            end_time: { [Op.not]: null }
          }
        })
      ]);

      // 计算成功率
      const successRate = newTasks > 0 ? 
        (completedTasks / newTasks * 100) : 0;

      // 保存或更新统计数据
      const statDate_str = date.toISOString().split('T')[0];
      const [stats, created] = await SystemStats.findOrCreate({
        where: {
          stat_date: statDate_str,
          stat_type: statType
        },
        defaults: {
          stat_date: statDate_str,
          stat_type: statType,
          total_users: totalUsers,
          new_users: newUsers,
          active_users: activeUsers,
          total_tasks: totalTasks,
          new_tasks: newTasks,
          completed_tasks: completedTasks,
          failed_tasks: failedTasks,
          top_tasks: topTasks,
          bottom_tasks: bottomTasks,
          outfit_tasks: outfitTasks,
          dress_tasks: dressTasks,
          total_images: totalImages,
          new_images: newImages,
          avg_processing_time: avgProcessingTime?.dataValues?.avg_time || null,
          success_rate: successRate
        }
      });

      if (!created) {
        // 更新现有记录
        await stats.update({
          total_users: totalUsers,
          new_users: newUsers,
          active_users: activeUsers,
          total_tasks: totalTasks,
          new_tasks: newTasks,
          completed_tasks: completedTasks,
          failed_tasks: failedTasks,
          top_tasks: topTasks,
          bottom_tasks: bottomTasks,
          outfit_tasks: outfitTasks,
          dress_tasks: dressTasks,
          total_images: totalImages,
          new_images: newImages,
          avg_processing_time: avgProcessingTime?.dataValues?.avg_time || null,
          success_rate: successRate
        });
      }

      return stats;
    } catch (error) {
      console.error('生成统计数据失败:', error);
      throw new Error(`生成统计数据失败: ${error.message}`);
    }
  }

  /**
   * 计算统计摘要
   * @param {Array} stats - 统计数据数组
   * @returns {Object} 统计摘要
   */
  calculateStatsSummary(stats) {
    if (!stats || stats.length === 0) {
      return null;
    }

    const totalNewUsers = stats.reduce((sum, stat) => sum + stat.new_users, 0);
    const totalNewTasks = stats.reduce((sum, stat) => sum + stat.new_tasks, 0);
    const totalCompletedTasks = stats.reduce((sum, stat) => sum + stat.completed_tasks, 0);
    const totalFailedTasks = stats.reduce((sum, stat) => sum + stat.failed_tasks, 0);
    
    const avgSuccessRate = stats.length > 0 ? 
      stats.reduce((sum, stat) => sum + (stat.success_rate || 0), 0) / stats.length : 0;

    return {
      period: {
        start: stats[0].stat_date,
        end: stats[stats.length - 1].stat_date,
        days: stats.length
      },
      totals: {
        newUsers: totalNewUsers,
        newTasks: totalNewTasks,
        completedTasks: totalCompletedTasks,
        failedTasks: totalFailedTasks
      },
      averages: {
        newUsersPerDay: Math.round(totalNewUsers / stats.length),
        newTasksPerDay: Math.round(totalNewTasks / stats.length),
        successRate: Math.round(avgSuccessRate * 100) / 100
      }
    };
  }

  /**
   * 清理过期统计数据
   * @param {number} retentionDays - 保留天数
   * @returns {number} 清理数量
   */
  async cleanupExpiredStats(retentionDays = 90) {
    try {
      const expireDate = new Date();
      expireDate.setDate(expireDate.getDate() - retentionDays);

      const deletedCount = await SystemStats.destroy({
        where: {
          stat_date: {
            [Op.lt]: expireDate.toISOString().split('T')[0]
          }
        }
      });

      console.log(`清理了 ${deletedCount} 条过期统计数据`);
      return deletedCount;
    } catch (error) {
      console.error('清理过期统计数据失败:', error);
      throw new Error(`清理过期统计数据失败: ${error.message}`);
    }
  }
}

module.exports = new StatsService();
