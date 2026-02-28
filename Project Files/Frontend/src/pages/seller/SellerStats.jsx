import { useEffect, useState } from "react";
import { getSellerDashboard } from "../../services/dashboardService"; 
import { BookOpen, ShoppingBag, IndianRupee } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line, ResponsiveContainer, LabelList
} from "recharts";
import "../../styles/Dashboard.css";

function SellerStats() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const data = await getSellerDashboard();
      setStats(data);
      setRecentOrders(data.recentOrders || []);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  const orderStatusData = stats
    ? Object.entries(stats.ordersByStatus || {}).map(([status, count]) => ({ status, count }))
    : [];

  const monthlyRevenueData = stats?.monthlyRevenue || [];

  const formatMonthYear = (dateStr) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 2) return dateStr;
    const [year, month] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${year} - ${months[parseInt(month, 10) - 1]}`;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (loading) {
    return <div className="dash-loader"><div className="spinner"></div></div>;
  }

  return (
    <div className="dashboard-overview">
      
      {/* ── KPI CARDS ── */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-blue-light">
            <BookOpen size={24} className="text-blue" />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Active Books</p>
            <h3 className="kpi-value">{stats.totalBooks || 0}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-orange-light">
            <ShoppingBag size={24} className="text-orange" />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Total Orders</p>
            <h3 className="kpi-value">{stats.totalOrders || 0}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper bg-green-light">
            <IndianRupee size={24} className="text-green" />
          </div>
          <div className="kpi-info">
            <p className="kpi-label">Total Revenue</p>
            {/* Maps properly to totalSales from the API */}
            <h3 className="kpi-value">₹{(stats.totalSales || 0).toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* ── CHARTS ── */}
      <div className="charts-grid">
        <div className="chart-card">
          <div className="chart-header">
            <h4>Orders by Status</h4>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={orderStatusData} margin={{ top: 20, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="status" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={40}>
                  <LabelList dataKey="count" position="top" fill="#64748b" fontSize={13} fontWeight={600} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <h4>Monthly Revenue</h4>
          </div>
          <div className="chart-body">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyRevenueData} margin={{ top: 25, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="month" tickFormatter={formatMonthYear} tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip 
                  labelFormatter={formatMonthYear}
                  formatter={(value) => [`₹${value}`, 'Revenue']}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} 
                />
                <Line type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }}>
                  <LabelList dataKey="revenue" position="top" offset={10} fill="#10b981" fontSize={13} fontWeight={600} formatter={(val) => `₹${val}`} />
                </Line>
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── RECENT ORDERS TABLE ── */}
      <div className="table-card">
        <div className="table-header">
          <h4>Recent Orders</h4>
        </div>
        <div className="table-responsive">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total Amount</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length > 0 ? (
                recentOrders.map((o) => (
                  <tr key={o._id}>
                    <td className="font-mono text-primary">#{o._id.slice(-8).toUpperCase()}</td>
                    <td>
                      <div className="table-user-cell">
                        <div className="table-user-avatar">
                          {o.user?.name ? o.user.name.charAt(0).toUpperCase() : '?'}
                        </div>
                        <span className="table-user-name">{o.user?.name || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="font-weight-600">₹{o.totalAmount?.toFixed(2)}</td>
                    <td>
                      <span className={`status-badge status-${(o.status || '').toLowerCase()}`}>
                        {o.status}
                      </span>
                    </td>
                    <td className="text-muted table-date">{formatDate(o.createdAt)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-muted">No recent orders found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

export default SellerStats;