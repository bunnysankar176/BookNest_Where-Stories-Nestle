import React, { useEffect, useState } from "react";
import { getUserAnalytics } from "../../services/profileService";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList
} from "recharts";
import { 
  Package, 
  IndianRupee, 
  BookOpen, 
  TrendingUp, 
  Heart, 
  Clock, 
  CalendarDays,
  Award,
  Bookmark 
} from "lucide-react";
import "../../styles/History.css";

const History = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const data = await getUserAnalytics();
        setAnalytics(data);
      } catch (error) {
        console.error("Failed to fetch analytics", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="history-loader">
        <div className="spinner"></div>
        <p>Loading your reading journey...</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="history-error">
        <p>We couldn't load your history right now. Please try again later.</p>
      </div>
    );
  }

  // Custom Tooltip for Recharts
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="chart-tooltip">
          <p className="tooltip-label">{label}</p>
          <p className="tooltip-value">₹ {payload[0].value.toLocaleString()}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="history-page-wrapper">
      <div className="history-header">
        <div>
          <h1 className="history-title">Your Reading Journey</h1>
          <p className="history-subtitle">Track your orders, spending, and favorite genres.</p>
        </div>
        
        {/* === PREMIUM MEMBER SINCE BADGE === */}
        <div className="premium-member-badge">
          <div className="premium-icon-ring">
            <Award size={20} />
          </div>
          <div className="premium-text">
            <span className="premium-label">Member Since</span>
            <span className="premium-date">
              {new Date(analytics.memberSince).toLocaleDateString('en-IN', {
                year: 'numeric', month: 'long', day: 'numeric'
              })}
            </span>
          </div>
        </div>
      </div>

      {/* ===== KPI CARDS ===== */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrapper blue">
            <Package size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Total Orders</p>
            <h3 className="kpi-value">{analytics.totalOrders}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper green">
            <IndianRupee size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Total Spent</p>
            <h3 className="kpi-value">₹ {analytics.totalSpent?.toLocaleString()}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper purple">
            <BookOpen size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Books Purchased</p>
            <h3 className="kpi-value">{analytics.totalBooksPurchased}</h3>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrapper orange">
            <TrendingUp size={24} />
          </div>
          <div className="kpi-content">
            <p className="kpi-label">Avg. Order Value</p>
            <h3 className="kpi-value">₹ {analytics.averageOrderValue?.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* ===== MAIN DASHBOARD GRID ===== */}
      <div className="dashboard-grid-custom">
        
        {/* ROW 1: Chart and Status */}
        <div className="dashboard-row top-row">
          {/* CHART */}
          <div className="dashboard-card chart-card">
            <div className="card-header">
              <h2>Monthly Spending</h2>
              <span className="header-badge">Last 6 Months</span>
            </div>
            <div className="chart-container">
              <ResponsiveContainer width="100%" height="100%">
                {/* Increased top margin to fit the permanent labels */}
                <BarChart data={analytics.monthlySpending} margin={{ top: 25, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }} 
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748b', fontSize: 12 }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9' }} />
                  <Bar 
                    dataKey="total" 
                    fill="#6366f1" 
                    radius={[6, 6, 0, 0]} 
                    maxBarSize={50}
                    animationDuration={1500}
                  >
                    {/* Always show amount on top of the bars */}
                    <LabelList 
                      dataKey="total" 
                      position="top" 
                      fill="#6366f1" 
                      fontSize={13} 
                      fontWeight={700}
                      formatter={(val) => `₹${val}`}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* ORDER STATUS */}
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Order Status Breakdown</h2>
            </div>
            <div className="status-grid">
              {Object.entries(analytics.orderStatusBreakdown || {}).map(([status, count]) => (
                <div className={`status-item ${status.toLowerCase()}`} key={status}>
                  <div className="status-info">
                    <span className="status-dot"></span>
                    <span className="status-name">{status}</span>
                  </div>
                  <span className="status-count">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ROW 2: Favorite Category & Last Order Details */}
        <div className="dashboard-row bottom-row three-cards"> 
          
          {/* 1. FAVORITE CATEGORY */}
          <div className="dashboard-card highlight-card">
            <div className="highlight-icon">
              <Heart size={28} fill="#ec4899" color="#ec4899" />
            </div>
            <h3>Favorite Category</h3>
            <p className="highlight-value">{analytics.favoriteCategory || "Mixed Themes"}</p>
            <p className="highlight-sub">Based on your recent purchases</p>
          </div>

          {/* 2. FAVORITE GENRE */}
          <div className="dashboard-card highlight-card">
            {/* Using a blue theme for the genre icon to distinguish it */}
            <div className="highlight-icon" style={{ backgroundColor: '#eef2ff' }}>
              <Bookmark size={28} fill="#6366f1" color="#6366f1" />
            </div>
            <h3>Favorite Genre</h3>
            <p className="highlight-value">{analytics.favoriteGenre || "Mixed Genres"}</p>
            <p className="highlight-sub">Based on your recent purchases</p>
          </div>

          {/* 3. LAST ORDER */}
          <div className="dashboard-card list-card">
            <div className="card-header">
              <h2>Last Order Details</h2>
              <Clock size={18} className="header-icon" />
            </div>
            {analytics.lastOrder ? (
              <div className="last-order-details">
                <div className="detail-row">
                  <span className="detail-label">Date</span>
                  <span className="detail-value font-medium">
                    {new Date(analytics.lastOrder.createdAt).toLocaleDateString('en-IN', {
                      year: 'numeric', month: 'short', day: 'numeric'
                    })}
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-label">Amount</span>
                  <span className="detail-value text-green font-bold">₹ {analytics.lastOrder.totalAmount}</span>
                </div>
                <div className="detail-row" style={{ marginTop: '0.5rem' }}>
                  <span className="detail-label">Status</span>
                  <span className={`status-badge ${analytics.lastOrder.status?.toLowerCase()}`}>
                    {analytics.lastOrder.status}
                  </span>
                </div>
              </div>
            ) : (
              <div className="empty-state">No recent orders</div>
            )}
          </div>
          
        </div>

      </div>
    </div>
  );
};

export default History;