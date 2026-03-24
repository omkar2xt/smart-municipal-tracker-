import { useState } from 'react';
import Container from '../components/Container';
import Grid from '../components/Grid';
import Card from '../components/Card';
import Button from '../components/Button';
import Badge from '../components/Badge';
import DarkModeToggle from '../components/DarkModeToggle';

export default function DashboardPage() {
  const [stats] = useState([
    { label: 'Total Users', value: '2,543', trend: '+12.5%' },
    { label: 'Revenue', value: '$45,230', trend: '+8.2%' },
    { label: 'Orders', value: '12,420', trend: '+23.1%' },
    { label: 'Conversion', value: '3.24%', trend: '-2.4%' },
  ]);

  const [tasks] = useState([
    { id: 1, title: 'Redesign homepage', status: 'In Progress', priority: 'high' },
    { id: 2, title: 'Fix auth bug', status: 'Completed', priority: 'medium' },
    { id: 3, title: 'Update docs', status: 'Todo', priority: 'low' },
  ]);

  const statusColors = {
    'In Progress': 'warning',
    'Completed': 'success',
    'Todo': 'gray',
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <Container className="py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Welcome back, Admin
              </p>
            </div>
            <DarkModeToggle />
          </div>
        </Container>
      </div>

      {/* Main Content */}
      <Container className="py-10">
        {/* Stats Grid */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Overview
          </h2>
          <Grid cols={4}>
            {stats.map((stat) => (
              <Card key={stat.label} hoverable>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  {stat.label}
                </p>
                <h3 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </h3>
                <p className={`text-sm ${
                  stat.trend?.toString().trim().startsWith('-')
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-green-600 dark:text-green-400'
                }`}>
                  {stat.trend}
                </p>
              </Card>
            ))}
          </Grid>
        </div>

        {/* Tasks Section */}
        <div className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Recent Tasks
            </h2>
            <Button variant="primary" size="sm">
              View All
            </Button>
          </div>

          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Task
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                      Priority
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                        {task.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge variant={statusColors[task.status]}>
                          {task.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Badge
                          variant={
                            task.priority === 'high'
                              ? 'error'
                              : task.priority === 'medium'
                              ? 'warning'
                              : 'success'
                          }
                        >
                          {task.priority}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Action Cards */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <Grid cols={3}>
            <Card title="Create User" subtitle="Add a new team member">
              <Button variant="outline" className="w-full mt-4">
                Create
              </Button>
            </Card>
            <Card title="Generate Report" subtitle="Export analytics data">
              <Button variant="outline" className="w-full mt-4">
                Export
              </Button>
            </Card>
            <Card title="Settings" subtitle="Manage preferences">
              <Button variant="outline" className="w-full mt-4">
                Configure
              </Button>
            </Card>
          </Grid>
        </div>
      </Container>
    </div>
  );
}
