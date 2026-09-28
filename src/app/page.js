'use client';

import React, { useState, useEffect } from 'react';
import ThemeSwitcher from './components/ThemeSwitcher';


export default function Home() {
  const [user, setUser] = useState(null);
  const [file, setFile] = useState(null);
  const [jobDescription, setJobDescription] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [stats, setStats] = useState({
    totalResumes: 0,
    averageScore: 0,
    topMatchedSkills: [],
    topMissingSkills: [],
  });
  const [error, setError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  // Verify user authentication and load stats
  useEffect(() => {
    fetchUser();
  }, []);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (!res.ok) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();

      // If admin, auto-redirect to admin portal
      if (data.user.role === 'admin') {
        window.location.href = '/admin';
        return;
      }

      setUser(data.user);
      // Once authenticated, load history and aggregate statistics
      fetchResumesAndStats();
    } catch (err) {
      console.error(err);
      window.location.href = '/login';
    }
  };

  const fetchResumesAndStats = async () => {
    try {
      const res = await fetch('/api/resumes');
      if (!res.ok) throw new Error('Failed to load records');
      const data = await res.json();
      setResumes(data.resumes || []);
      setStats(data.stats || {
        totalResumes: 0,
        averageScore: 0,
        topMatchedSkills: [],
        topMissingSkills: [],
      });
    } catch (err) {
      console.error(err);
      setError('Could not fetch previous analyses.');
    }
  };

  const handleLogout = async () => {
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
      setError('Failed to log out.');
    }
  };

  // Drag and Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'application/pdf') {
        setFile(droppedFile);
        setError('');
      } else {
        setError('Only PDF files are supported.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Only PDF files are supported.');
      }
    }
  };

  const removeFile = (e) => {
    e.stopPropagation();
    setFile(null);
  };

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please upload a PDF resume.');
      return;
    }
    if (!jobDescription.trim()) {
      setError('Please input the target job description.');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setAnalysisResult(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('jobDescription', jobDescription);

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await res.json();
      setAnalysisResult(result);

      // Reset inputs
      setFile(null);
      setJobDescription('');

      // Refresh history & stats
      await fetchResumesAndStats();
    } catch (err) {
      console.error(err);
      setError(err.message || 'An error occurred during parsing.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this analysis?')) return;

    try {
      const res = await fetch(`/api/resumes?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete resume');

      // Refresh list & stats
      await fetchResumesAndStats();

      // Clear active view panel if we deleted the active one
      if (analysisResult && analysisResult._id === id) {
        setAnalysisResult(null);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to delete history item.');
    }
  };

  const handleViewAnalysis = (resume) => {
    setAnalysisResult(resume);
    // Scroll to results section on mobile
    window.scrollTo({ top: 380, behavior: 'smooth' });
  };

  // Helper for Circular SVG gauge
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  const getScoreOffset = (score) => circumference - (score / 100) * circumference;

  const getScoreColor = (score) => {
    if (score >= 75) return '#10b981'; // Success (Emerald)
    if (score >= 50) return '#f59e0b'; // Warning (Amber)
    return '#ef4444'; // Danger (Rose)
  };

  const getScoreClass = (score) => {
    if (score >= 75) return 'verdict-high';
    if (score >= 50) return 'verdict-med';
    return 'verdict-low';
  };

  const getScoreVerdict = (score) => {
    if (score >= 85) return 'Excellent Match';
    if (score >= 70) return 'Good Alignment';
    if (score >= 50) return 'Needs Work';
    return 'Weak Fit';
  };

  const matchedCount = analysisResult?.analysis?.matchedSkills ? analysisResult.analysis.matchedSkills.length : 0;
  const missingCount = analysisResult?.analysis?.missingSkills ? analysisResult.analysis.missingSkills.length : 0;
  const totalSkills = matchedCount + missingCount;
  const radiusChart = 48;
  const strokeWidthChart = 8;
  const circumferenceChart = 2 * Math.PI * radiusChart;
  const matchedLength = totalSkills > 0 ? (matchedCount / totalSkills) * circumferenceChart : 0;
  const missingLength = totalSkills > 0 ? (missingCount / totalSkills) * circumferenceChart : 0;
  const matchRatioPercent = totalSkills > 0 ? Math.round((matchedCount / totalSkills) * 100) : 0;

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="logo-section">
          <h1><span>✨</span> AI Resume Analyzer</h1>
          <p>Optimize your resume for applicant tracking systems using GenAI & MongoDB</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <ThemeSwitcher />
          {user && (
            <div className="user-profile-widget" style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--glass-bg)', padding: '0.6rem 1.2rem', borderRadius: '30px', border: '1px solid var(--glass-border)' }}>
              <div className="user-avatar" style={{ width: '34px', height: '34px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent) 0%, var(--primary) 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.95rem', color: '#fff', textTransform: 'uppercase' }}>
                {user.username.slice(0, 2)}
              </div>
              <div className="user-info-text" style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: '600', color: '#fff' }}>{user.username}</span>
                <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--primary)', fontWeight: '700' }}>
                  Candidate
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-icon"
                title="Sign Out"
                style={{ marginLeft: '0.5rem', borderRadius: '50%', width: '32px', height: '32px' }}
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Stats Cards */}
      <section className="stats-container">
        <div className="stat-card">
          <div className="stat-label">Total Analyzed</div>
          <div className="stat-value">{stats.totalResumes}</div>
          <div className="stat-desc">Resumes parsed by you</div>
        </div>
        <div className="stat-card secondary">
          <div className="stat-label">Average Score</div>
          <div className="stat-value">
            {stats.averageScore}<span>%</span>
          </div>
          <div className="stat-desc">Your personal alignment rate</div>
        </div>
        <div className="stat-card accent">
          <div className="stat-label">Top Skill Matched</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', height: '3.375rem', display: 'flex', alignItems: 'center' }}>
            {stats.topMatchedSkills.length > 0 ? stats.topMatchedSkills[0]._id : 'None Yet'}
          </div>
          <div className="stat-desc">Most common matching capability</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Common Skill Gap</div>
          <div className="stat-value" style={{ fontSize: '1.25rem', height: '3.375rem', display: 'flex', alignItems: 'center', color: 'var(--warning)' }}>
            {stats.topMissingSkills.length > 0 ? stats.topMissingSkills[0]._id : 'None Yet'}
          </div>
          <div className="stat-desc">Top requested skill missing</div>
        </div>
      </section>

      {/* Dashboard Grid */}
      <main className="dashboard-grid">
        {/* Left Side: Upload & Input Panel (Or Admin Portal Welcome Card) */}
        <section className="glass-panel">
          <h2 className="panel-title">
            Analyze Resume <span className="badge">New</span>
          </h2>

          {error && (
            <div className="error-banner">
              <span>⚠️</span> {error}
            </div>
          )}

          <form onSubmit={handleAnalyze}>
            <div className="form-group">
              <label className="form-label">Resume PDF File</label>
              <div
                className={`upload-zone ${isDragOver ? 'dragover' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <input
                  type="file"
                  id="fileInput"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={handleFileChange}
                />

                <svg className="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>

                <p className="upload-text">Drag and drop your PDF resume here</p>
                <p className="upload-subtext">or click to browse local files (PDF only)</p>

                {file && (
                  <div className="selected-file-info" onClick={(e) => e.stopPropagation()}>
                    <div className="file-details">
                      <span className="file-icon-pdf">PDF</span>
                      <span>{file.name}</span>
                    </div>
                    <button className="remove-file-btn" onClick={removeFile} title="Remove file">
                      <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Target Job Description</label>
              <textarea
                className="textarea-field"
                placeholder="Paste the target job description here to compare against the resume..."
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              ></textarea>
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={isAnalyzing || !file || !jobDescription.trim()}
            >
              {isAnalyzing ? (
                <>
                  <div className="spinner"></div>
                  Analyzing Match...
                </>
              ) : (
                <>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  Analyze Resume
                </>
              )}
            </button>
          </form>
        </section>

        {/* Right Side: Analysis Display Panel */}
        <section className="glass-panel" style={{ minHeight: '520px' }}>
          <h2 className="panel-title">ATS Match Assessment</h2>

          {isAnalyzing && (
            <div className="results-placeholder" style={{ border: 'none' }}>
              <div className="spinner" style={{ width: '48px', height: '48px', borderWidth: '3px', marginBottom: '1.5rem', borderColor: 'rgba(var(--primary-rgb), 0.2)', borderTopColor: 'var(--primary)' }}></div>
              <h3>Analyzing Alignment</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '300px', marginTop: '0.25rem' }}>
                Extracting resume content and querying Gemini AI for suitability details...
              </p>
            </div>
          )}

          {!isAnalyzing && !analysisResult && (
            <div className="results-placeholder">
              <svg className="placeholder-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3>No Analysis Loaded</h3>
              <p>
                Upload a resume and enter a job description to trigger ATS matching, or select a record from the history table below.
              </p>
            </div>
          )}

          {!isAnalyzing && analysisResult && (
            <div className="results-display">
              {/* Score SVG circle and Verdict */}
              <div className="results-header-grid">
                <div className="gauge-container">
                  <svg className="gauge-svg">
                    <circle className="gauge-bg-circle" cx="65" cy="65" r={radius} />
                    <circle
                      className="gauge-fill-circle"
                      cx="65"
                      cy="65"
                      r={radius}
                      stroke={getScoreColor(analysisResult.analysis.score)}
                      strokeDasharray={circumference}
                      strokeDashoffset={getScoreOffset(analysisResult.analysis.score)}
                    />
                  </svg>
                  <div className="score-text">
                    <div className="score-num" style={{ color: getScoreColor(analysisResult.analysis.score) }}>
                      {analysisResult.analysis.score}
                    </div>
                    <div className="score-label">Match %</div>
                  </div>
                </div>

                <div>
                  <div className={`score-verdict ${getScoreClass(analysisResult.analysis.score)}`}>
                    {getScoreVerdict(analysisResult.analysis.score)}
                  </div>
                  <p className="summary-text">{analysisResult.analysis.summary}</p>
                </div>
              </div>

              {/* Skills Alignment Chart */}
              <div className="skills-chart-panel" style={{ marginBottom: '2rem', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(255, 255, 255, 0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: '700', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  📊 Skills Alignment Chart
                </h4>

                <div style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-around', gap: '1.5rem', flexWrap: 'wrap' }}>
                  {/* Donut Chart SVG */}
                  <div style={{ position: 'relative', width: '120px', height: '120px' }}>
                    <svg style={{ transform: 'rotate(-90deg)', width: '100%', height: '100%' }}>
                      <circle cx="60" cy="60" r={radiusChart} stroke="rgba(255, 255, 255, 0.05)" strokeWidth={strokeWidthChart} fill="none" />

                      {/* Matched slice */}
                      {totalSkills > 0 && matchedCount > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r={radiusChart}
                          stroke="#10b981"
                          strokeWidth={strokeWidthChart}
                          fill="none"
                          strokeDasharray={`${matchedLength} ${circumferenceChart}`}
                          strokeDashoffset={0}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.5s ease-in-out' }}
                        />
                      )}

                      {/* Missing slice */}
                      {totalSkills > 0 && missingCount > 0 && (
                        <circle
                          cx="60"
                          cy="60"
                          r={radiusChart}
                          stroke="rgba(239, 68, 68, 0.85)"
                          strokeWidth={strokeWidthChart}
                          fill="none"
                          strokeDasharray={`${missingLength} ${circumferenceChart}`}
                          strokeDashoffset={-matchedLength}
                          strokeLinecap="round"
                          style={{ transition: 'stroke-dasharray 0.5s ease-in-out, stroke-dashoffset 0.5s ease-in-out' }}
                        />
                      )}
                    </svg>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.25rem', fontWeight: '800', color: '#fff' }}>{matchRatioPercent}%</span>
                      <span style={{ fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Matched</span>
                    </div>
                  </div>

                  {/* Legend details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', flex: '1', minWidth: '150px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Matched Capabilities</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{matchedCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.35rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.85)' }}></span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Identified Gaps</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{missingCount}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.2)' }}></span>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Total Keywords</span>
                      </div>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#fff' }}>{totalSkills}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Skills comparisons */}
              <div className="skills-comparison-grid">
                <div className="skills-column matched">
                  <h4>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Matched Capabilities
                  </h4>
                  {analysisResult.analysis.matchedSkills && analysisResult.analysis.matchedSkills.length > 0 ? (
                    <div className="skills-list">
                      {analysisResult.analysis.matchedSkills.map((skill, idx) => (
                        <span key={idx} className="skill-pill matched">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="no-skills-msg">No direct skills matched.</p>
                  )}
                </div>

                <div className="skills-column missing">
                  <h4>
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    Identified Gaps
                  </h4>
                  {analysisResult.analysis.missingSkills && analysisResult.analysis.missingSkills.length > 0 ? (
                    <div className="skills-list">
                      {analysisResult.analysis.missingSkills.map((skill, idx) => (
                        <span key={idx} className="skill-pill missing">{skill}</span>
                      ))}
                    </div>
                  ) : (
                    <p className="no-skills-msg">All major skills present!</p>
                  )}
                </div>
              </div>

              {/* Extra match criteria */}
              <div className="criteria-grid">
                <div className="criteria-card">
                  <h5>Experience Match</h5>
                  <p>{analysisResult.analysis.experienceMatch || 'Not Specified'}</p>
                </div>
                <div className="criteria-card">
                  <h5>Education Match</h5>
                  <p>{analysisResult.analysis.educationMatch || 'Not Specified'}</p>
                </div>
              </div>

              {/* Target Job Description */}
              <div className="criteria-card" style={{ marginTop: '1rem', width: '100%', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: '700' }}>Target Job Description</h5>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#e2e8f0', lineHeight: '1.5', maxHeight: '150px', overflowY: 'auto', whiteSpace: 'pre-line', paddingRight: '0.5rem' }}>
                  {analysisResult.jobDescription}
                </p>
              </div>

              {/* Actionable suggestions */}
              <div className="suggestions-panel">
                <h4>
                  <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  Optimization Suggestions
                </h4>
                {analysisResult.analysis.suggestions && analysisResult.analysis.suggestions.length > 0 ? (
                  <ul className="suggestions-list">
                    {analysisResult.analysis.suggestions.map((suggestion, idx) => (
                      <li key={idx}>{suggestion}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="no-skills-msg" style={{ paddingLeft: '0.25rem' }}>No enhancements suggested.</p>
                )}
              </div>
            </div>
          )}
        </section>
      </main>

      {/* History section */}
      <section className="history-section">
        <div className="history-header">
          <h2>Your Analysis History</h2>
        </div>

        {resumes.length === 0 ? (
          <div className="no-history">
            No resumes analyzed yet. Upload one above to get started!
          </div>
        ) : (
          <div className="history-list">
            {resumes.map((resume) => (
              <div
                key={resume._id}
                className="history-item"
                style={{ cursor: 'pointer', outline: analysisResult && analysisResult._id === resume._id ? '1px solid var(--primary)' : 'none' }}
                onClick={() => handleViewAnalysis(resume)}
              >
                <div className="history-info">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.25rem' }}>
                    <h4 style={{ margin: 0 }}>{resume.fileName}</h4>
                  </div>
                  <p>{resume.extractedText.slice(0, 100).trim()}...</p>
                </div>
                <div className="history-score">
                  <div className={`score-badge ${resume.analysis.score >= 75 ? 'high' : resume.analysis.score >= 50 ? 'med' : 'low'
                    }`}>
                    {resume.analysis.score}%
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Match</span>
                </div>
                <div className="history-date">
                  {new Date(resume.uploadDate).toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </div>
                <div className="history-actions">
                  <button
                    className="btn-icon delete"
                    onClick={(e) => handleDelete(resume._id, e)}
                    title="Delete resume analysis"
                  >
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
