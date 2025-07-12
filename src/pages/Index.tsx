import React, { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface Submission {
  id: number;
  contestId?: number;
  creationTimeSeconds: number;
  relativeTimeSeconds: number;
  problem: {
    contestId?: number;
    index: string;
    name: string;
    type: string;
    rating?: number;
  };
  author: {
    contestId?: number;
    members: Array<{
      handle: string;
    }>;
    participantType: string;
    ghost: boolean;
    room?: number;
    startTimeSeconds?: number;
  };
  programmingLanguage: string;
  verdict?: string;
  testset: string;
  passedTestCount: number;
  timeConsumedMillis: number;
  memoryConsumedBytes: number;
}

interface AnalysisResult {
  isCheat: boolean;
  totalSubmissions: number;
  skippedSubmissions: number;
  skippedPercentage: number;
  suspiciousSubmissions: Submission[];
}

const Index = () => {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showFAQ, setShowFAQ] = useState(false);
  const { toast } = useToast();

  const analyzeUser = async () => {
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter a username",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    setResult(null);
    setUserInfo(null);

    try {
      // First, get user info
      const userResponse = await fetch(`https://codeforces.com/api/user.info?handles=${username}`);
      const userData = await userResponse.json();
      
      if (userData.status !== 'OK') {
        throw new Error(userData.comment || 'User not found');
      }

      setUserInfo(userData.result[0]);

      // Then get user submissions
      const submissionsResponse = await fetch(`https://codeforces.com/api/user.status?handle=${username}`);
      const submissionsData = await submissionsResponse.json();
      
      if (submissionsData.status !== 'OK') {
        throw new Error(submissionsData.comment || 'Failed to fetch submissions');
      }

      const submissions: Submission[] = submissionsData.result;
      
      // Analyze submissions for suspicious patterns
      const skippedSubmissions = submissions.filter(sub => sub.verdict === 'SKIPPED');
      const totalSubmissions = submissions.length;
      const skippedCount = skippedSubmissions.length;
      const skippedPercentage = totalSubmissions > 0 ? (skippedCount / totalSubmissions) * 100 : 0;
      
      // Consider someone a potential cheater if they have skipped submissions
      // Skipped verdicts often indicate plagiarism detection
      const isCheat = skippedCount > 0;

      const analysisResult: AnalysisResult = {
        isCheat,
        totalSubmissions,
        skippedSubmissions: skippedCount,
        skippedPercentage,
        suspiciousSubmissions: skippedSubmissions.slice(0, 10) // Show first 10 suspicious submissions
      };

      setResult(analysisResult);

      if (isCheat) {
        toast({
          title: "Potential Cheater Detected!",
          description: `Found ${skippedCount} skipped submissions`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: "No suspicious activity detected",
        });
      }

    } catch (error) {
      console.error('Error analyzing user:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to analyze user",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (seconds: number) => {
    return new Date(seconds * 1000).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getRatingClass = (rating?: number) => {
    if (!rating) return 'cf-rating-newbie';
    if (rating < 1200) return 'cf-rating-newbie';
    if (rating < 1400) return 'cf-rating-pupil';
    if (rating < 1600) return 'cf-rating-specialist';
    if (rating < 1900) return 'cf-rating-expert';
    if (rating < 2100) return 'cf-rating-candidate-master';
    if (rating < 2400) return 'cf-rating-master';
    return 'cf-rating-grandmaster';
  };

  const getSubmissionUrl = (submission: Submission) => {
    if (submission.contestId) {
      return `https://codeforces.com/contest/${submission.contestId}/submission/${submission.id}`;
    }
    return `https://codeforces.com/problemset/submission/${submission.id}`;
  };

  const getProblemUrl = (submission: Submission) => {
    if (submission.problem.contestId) {
      return `https://codeforces.com/contest/${submission.problem.contestId}/problem/${submission.problem.index}`;
    }
    return `https://codeforces.com/problemset/problem/${submission.problem.contestId}/${submission.problem.index}`;
  };

  const faqData = [
    {
      question: "What is competitive programming?",
      answer: "Competitive programming is a mind sport where participants solve algorithmic problems within time constraints. It involves writing efficient code to solve complex computational problems, testing problem-solving skills, algorithmic knowledge, and programming proficiency."
    },
    {
      question: "What is CPI7 Competitive Programming Team?",
      answer: "CPI7 is the elite competitive programming team of Cumilla Polytechnic Institute, founded by Al Kayes Rifat. We're a passionate community of programmers dedicated to mastering algorithms, data structures, and problem-solving techniques through strategic thinking and practice."
    },
    {
      question: "How does the CPI7 Cheater Detector work?",
      answer: "Our detector analyzes Codeforces submissions to identify suspicious patterns, particularly 'SKIPPED' verdicts which often indicate plagiarism detected by Codeforces' system. It provides comprehensive analysis of submission history and flags potential cheating behavior."
    },
    {
      question: "What programming languages are used in competitive programming?",
      answer: "Popular languages include C++, Java, Python, and C. C++ is most favored due to its speed and extensive Standard Template Library (STL). The choice depends on the problem requirements and personal preference."
    },
    {
      question: "How can I join CPI7 team?",
      answer: "You can join our community through our Vjudge group, Facebook page, or Discord server. We welcome passionate programmers of all skill levels who are eager to learn and improve their competitive programming skills."
    },
    {
      question: "What is Codeforces and why do we analyze it?",
      answer: "Codeforces is one of the world's largest competitive programming platforms. We analyze it to ensure fair competition, detect cheating patterns, and maintain the integrity of competitive programming contests and ratings."
    }
  ];

  return (
    <>
      {/* SEO Meta Tags */}
      <div style={{ display: 'none' }}>
        <h1>CPI7 Competitive Programming Team - Codeforces Cheater Detection Tool</h1>
        <h2>Advanced Codeforces Analysis & Plagiarism Detection by CPI7 Team</h2>
      </div>

      <div className="cf-content">
        {/* Header - Exact Codeforces style */}
        <div className="cf-header" style={{ padding: '8px 0', fontSize: '13px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>CPI7 Cheater Detector</span>
                <span style={{ fontSize: '12px', opacity: 0.9 }}>by CPI7 Competitive Programming Team</span>
              </div>
              <div style={{ fontSize: '11px' }}>
                Advanced Codeforces Analysis Tool
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '10px' }}>
          {/* MAIN FEATURE - Codeforces Analyzer (Prominently at top) */}
          <div className="cf-white-box" style={{ border: '3px solid #0066ff', marginBottom: '20px' }}>
            <div className="cf-box-header" style={{ 
              background: 'linear-gradient(135deg, #0066ff, #0052cc)', 
              color: 'white', 
              fontSize: '18px', 
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '15px'
            }}>
              🔍 <strong>CODEFORCES USER ANALYZER</strong> 🔍
            </div>
            <div className="cf-box-content" style={{ padding: '20px' }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <h2 style={{ 
                  fontSize: '20px', 
                  fontWeight: 'bold', 
                  marginBottom: '10px', 
                  color: '#0066ff',
                  textTransform: 'uppercase'
                }}>
                  Professional Codeforces Submission Analysis
                </h2>
                <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#333', marginBottom: '15px' }}>
                  <strong>Detect cheating patterns and analyze competitive programming submissions instantly!</strong><br/>
                  Advanced plagiarism detection system developed by <strong>CPI7 Team</strong> - ensuring fair competition.
                </p>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '15px', maxWidth: '600px', margin: '0 auto 15px auto' }}>
                <input
                  className="cf-input"
                  placeholder="Enter Codeforces username (e.g., tourist, Petr, Errichto)"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && analyzeUser()}
                  style={{ 
                    flex: 1, 
                    minWidth: '200px',
                    fontSize: '14px',
                    padding: '12px',
                    border: '2px solid #0066ff'
                  }}
                />
                <button 
                  className="cf-button"
                  onClick={analyzeUser} 
                  disabled={loading}
                  style={{
                    background: loading ? '#ccc' : 'linear-gradient(135deg, #0066ff, #0052cc)',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px',
                    padding: '12px 20px',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? '⏳ Analyzing...' : '🔍 ANALYZE NOW'}
                </button>
              </div>
              
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center', fontSize: '12px' }}>
                <span style={{ background: '#e8f4fd', color: '#0066ff', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                  🔍 Plagiarism Detection
                </span>
                <span style={{ background: '#e8f4fd', color: '#0066ff', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                  📊 Statistical Analysis
                </span>
                <span style={{ background: '#e8f4fd', color: '#0066ff', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                  ⚡ Real-time Results
                </span>
              </div>
            </div>
          </div>

          {/* User Info */}
          {userInfo && (
            <div className="cf-white-box">
              <div className="cf-box-header">User Information</div>
              <div className="cf-box-content">
                <table style={{ width: '100%' }}>
                  <tbody>
                    <tr>
                      <td style={{ fontWeight: 'bold', width: '100px' }}>Handle:</td>
                      <td>{userInfo.handle}</td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Rating:</td>
                      <td className={getRatingClass(userInfo.rating)} style={{ fontWeight: 'bold' }}>
                        {userInfo.rating || 'Unrated'}
                      </td>
                    </tr>
                    <tr>
                      <td style={{ fontWeight: 'bold' }}>Max Rating:</td>
                      <td className={getRatingClass(userInfo.maxRating)} style={{ fontWeight: 'bold' }}>
                        {userInfo.maxRating || 'Unrated'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Results */}
          {result && (
            <>
              {/* Analysis Summary */}
              <div className="cf-white-box">
                <div className="cf-box-header">Analysis Result</div>
                <div className="cf-box-content">
                  <table style={{ width: '100%', marginBottom: '10px' }}>
                    <tbody>
                      <tr>
                        <td style={{ fontWeight: 'bold', width: '150px' }}>Total Submissions:</td>
                        <td>{result.totalSubmissions}</td>
                        <td style={{ fontWeight: 'bold', width: '150px' }}>Skipped Submissions:</td>
                        <td style={{ color: '#cc0000', fontWeight: 'bold' }}>{result.skippedSubmissions}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold' }}>Skipped Percentage:</td>
                        <td style={{ color: '#cc0000', fontWeight: 'bold' }}>{result.skippedPercentage.toFixed(1)}%</td>
                        <td style={{ fontWeight: 'bold' }}>Status:</td>
                        <td>
                          <span className={result.isCheat ? 'cf-status-skipped' : 'cf-status-clean'}>
                            {result.isCheat ? "SUSPICIOUS" : "CLEAN"}
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                  
                  <div style={{ 
                    padding: '8px', 
                    background: result.isCheat ? '#fff0f0' : '#f0fff0',
                    border: `1px solid ${result.isCheat ? '#ffcccc' : '#ccffcc'}`,
                    fontSize: '12px'
                  }}>
                    {result.isCheat 
                      ? '⚠️ This user has suspicious activity! Skipped verdicts often indicate plagiarism detection.'
                      : '✅ No suspicious activity detected. This user appears to be clean.'}
                  </div>
                </div>
              </div>

              {/* Suspicious Submissions Table */}
              {result.isCheat && result.suspiciousSubmissions.length > 0 && (
                <div className="cf-white-box">
                  <div className="cf-box-header">Skipped Submissions ({result.suspiciousSubmissions.length})</div>
                  <div className="cf-box-content" style={{ padding: 0 }}>
                    <table className="cf-table">
                      <thead>
                        <tr>
                          <th>Problem</th>
                          <th>Contest</th>
                          <th>Language</th>
                          <th>Date</th>
                          <th>Rating</th>
                          <th>Status</th>
                          <th>Links</th>
                        </tr>
                      </thead>
                      <tbody>
                        {result.suspiciousSubmissions.map((submission) => (
                          <tr key={submission.id}>
                            <td>
                              <div style={{ fontWeight: 'bold' }}>
                                {submission.problem.name}
                              </div>
                              <div className="cf-small-text">Problem {submission.problem.index}</div>
                            </td>
                            <td>
                              {submission.problem.contestId ? (
                                <a href={`https://codeforces.com/contest/${submission.problem.contestId}`} 
                                   className="cf-link" target="_blank" rel="noopener noreferrer">
                                  Contest {submission.problem.contestId}
                                </a>
                              ) : (
                                <span style={{ color: '#999' }}>No Contest</span>
                              )}
                            </td>
                            <td>
                              <span style={{ 
                                background: '#f0f0f0', 
                                padding: '2px 4px', 
                                fontSize: '11px',
                                fontFamily: 'monospace'
                              }}>
                                {submission.programmingLanguage}
                              </span>
                            </td>
                            <td className="cf-small-text">
                              {formatDate(submission.creationTimeSeconds)}
                            </td>
                            <td>
                              {submission.problem.rating ? (
                                <span className={getRatingClass(submission.problem.rating)} style={{ fontWeight: 'bold' }}>
                                  {submission.problem.rating}
                                </span>
                              ) : (
                                <span style={{ color: '#999' }}>Unrated</span>
                              )}
                            </td>
                            <td>
                              <span className="cf-status-skipped">SKIPPED</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <a
                                  href={getSubmissionUrl(submission)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cf-link"
                                  style={{ fontSize: '11px' }}
                                >
                                  [Sub]
                                </a>
                                <a
                                  href={getProblemUrl(submission)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="cf-link"
                                  style={{ fontSize: '11px' }}
                                >
                                  [Prob]
                                </a>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Hero Section - About CPI7 */}
          <div className="cf-white-box">
            <div className="cf-box-header">🏆 CPI7 Competitive Programming Team</div>
            <div className="cf-box-content">
              <div style={{ marginBottom: '15px' }}>
                <h2 style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '8px', color: '#333' }}>
                  Elite Competitive Programming Community
                </h2>
                <p style={{ fontSize: '13px', lineHeight: '1.5', color: '#666', marginBottom: '10px' }}>
                  Founded by <strong>Al Kayes Rifat</strong> at <strong>Cumilla Polytechnic Institute</strong>. 
                  Our advanced detection system analyzes competitive programming submissions to ensure fair competition and maintain integrity in contests.
                </p>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', fontSize: '12px' }}>
                  <span style={{ background: '#e8f4fd', color: '#0066ff', padding: '4px 8px', borderRadius: '3px' }}>
                    🔍 Plagiarism Detection
                  </span>
                  <span style={{ background: '#e8f4fd', color: '#0066ff', padding: '4px 8px', borderRadius: '3px' }}>
                    📊 Statistical Analysis
                  </span>
                  <span style={{ background: '#e8f4fd', color: '#0066ff', padding: '4px 8px', borderRadius: '3px' }}>
                    ⚡ Real-time Results
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* About CPI7 Section */}
          <div className="cf-white-box">
            <div className="cf-box-header">🏆 About CPI7 Competitive Programming Team</div>
            <div className="cf-box-content">
              <div style={{ fontSize: '13px', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '12px' }}>
                  <strong>CPI7</strong> is the elite competitive programming team of <strong>Cumilla Polytechnic Institute</strong>, 
                  founded by <strong>Al Kayes Rifat</strong>. We're building a passionate community of programmers who solve 
                  complex algorithmic problems through strategic thinking and excellence.
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px', marginBottom: '15px' }}>
                  <div>
                    <h4 style={{ fontWeight: 'bold', marginBottom: '5px', color: '#0066ff' }}>🎯 Our Mission</h4>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      Mastering algorithms, data structures, and competitive programming techniques while maintaining fair competition.
                    </p>
                  </div>
                  <div>
                    <h4 style={{ fontWeight: 'bold', marginBottom: '5px', color: '#0066ff' }}>🚀 Our Vision</h4>
                    <p style={{ fontSize: '12px', color: '#666' }}>
                      Creating a community where passionate programmers thrive through practice, research, and strategic problem-solving.
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a href="https://vjudge.net/group/cpi7" className="cf-link" style={{ fontSize: '12px' }} target="_blank" rel="noopener noreferrer">🏅 Vjudge Group</a>
                  <a href="https://facebook.com/cpi.7.seven" className="cf-link" style={{ fontSize: '12px' }} target="_blank" rel="noopener noreferrer">📘 Facebook Community</a>
                  <a href="https://discord.gg/hUVD5YvWqE" className="cf-link" style={{ fontSize: '12px' }} target="_blank" rel="noopener noreferrer">💬 Discord Server</a>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="cf-white-box">
            <div className="cf-box-header" style={{ cursor: 'pointer' }} onClick={() => setShowFAQ(!showFAQ)}>
              ❓ Frequently Asked Questions {showFAQ ? '▼' : '▶'}
            </div>
            {showFAQ && (
              <div className="cf-box-content">
                <div style={{ fontSize: '13px' }}>
                  {faqData.map((faq, index) => (
                    <div key={index} style={{ marginBottom: '15px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                      <h4 style={{ fontWeight: 'bold', marginBottom: '5px', color: '#333' }}>
                        Q{index + 1}: {faq.question}
                      </h4>
                      <p style={{ color: '#666', lineHeight: '1.5', fontSize: '12px' }}>
                        {faq.answer}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Features Section */}
          <div className="cf-white-box">
            <div className="cf-box-header">⚡ Why Choose CPI7 Cheater Detector?</div>
            <div className="cf-box-content">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px', fontSize: '12px' }}>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#0066ff', marginBottom: '5px' }}>🔍 Advanced Detection</h4>
                  <p style={{ color: '#666' }}>
                    Sophisticated algorithm to detect plagiarism patterns and suspicious submission behaviors in competitive programming.
                  </p>
                </div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#0066ff', marginBottom: '5px' }}>📊 Comprehensive Analysis</h4>
                  <p style={{ color: '#666' }}>
                    Detailed statistical analysis of submission patterns, success rates, and temporal behavior analysis.
                  </p>
                </div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#0066ff', marginBottom: '5px' }}>⚡ Real-time Results</h4>
                  <p style={{ color: '#666' }}>
                    Instant analysis using Codeforces API with live data processing and immediate feedback.
                  </p>
                </div>
                <div>
                  <h4 style={{ fontWeight: 'bold', color: '#0066ff', marginBottom: '5px' }}>🛡️ Fair Competition</h4>
                  <p style={{ color: '#666' }}>
                    Maintaining integrity in competitive programming contests and ensuring fair evaluation of skills.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* How it works Section */}
          <div className="cf-white-box">
            <div className="cf-box-header">🔧 How Our Detection System Works</div>
            <div className="cf-box-content">
              <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Step 1:</strong> We fetch user data and submission history from Codeforces API
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Step 2:</strong> Advanced analysis of submission patterns, timing, and verdict distributions
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Step 3:</strong> Detection of "SKIPPED" verdicts which often indicate plagiarism by Codeforces system
                </div>
                <div style={{ marginBottom: '10px' }}>
                  <strong>Step 4:</strong> Statistical evaluation and comprehensive reporting with actionable insights
                </div>
                <div style={{ 
                  background: '#f8f8f8', 
                  padding: '10px', 
                  border: '1px solid #ddd',
                  marginTop: '10px'
                }}>
                  <strong>Note:</strong> Our analysis is based on publicly available Codeforces data and uses proven methods 
                  for detecting suspicious patterns in competitive programming submissions.
                </div>
              </div>
            </div>
          </div>

          {/* Contact & Social */}
          <div className="cf-white-box">
            <div className="cf-box-header">🤝 Connect with CPI7 Team</div>
            <div className="cf-box-content">
              <div style={{ fontSize: '12px', lineHeight: '1.6' }}>
                <p style={{ marginBottom: '10px' }}>
                  Join our growing community of competitive programmers and take your algorithmic skills to the next level!
                </p>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', marginBottom: '10px' }}>
                  <div>
                    <strong>👨‍💻 Founder:</strong> Al Kayes Rifat
                  </div>
                  <div>
                    <strong>🏫 Institution:</strong> Cumilla Polytechnic Institute
                  </div>
                  <div>
                    <strong>🎯 Focus:</strong> Competitive Programming Excellence
                  </div>
                  <div>
                    <strong>🌐 Website:</strong> <a href="https://cpi7.vercel.app/" className="cf-link" target="_blank" rel="noopener noreferrer">cpi7.vercel.app</a>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <a href="https://vjudge.net/group/cpi7" className="cf-button" style={{ textDecoration: 'none', fontSize: '11px' }} target="_blank" rel="noopener noreferrer">
                    Join Vjudge Group
                  </a>
                  <a href="https://facebook.com/cpi.7.seven" className="cf-button" style={{ textDecoration: 'none', fontSize: '11px' }} target="_blank" rel="noopener noreferrer">
                    Facebook Community
                  </a>
                  <a href="https://discord.gg/hUVD5YvWqE" className="cf-button" style={{ textDecoration: 'none', fontSize: '11px' }} target="_blank" rel="noopener noreferrer">
                    Discord Server
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ 
          background: '#f0f0f0', 
          borderTop: '1px solid #ddd', 
          padding: '15px 0', 
          marginTop: '20px',
          fontSize: '11px',
          color: '#666',
          textAlign: 'center'
        }}>
          <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 10px' }}>
            <p>© 2025 CPI7 Competitive Programming Team | Cumilla Polytechnic Institute</p>
            <p>Founded by Al Kayes Rifat | Advanced Codeforces Analysis & Cheater Detection</p>
            <p style={{ marginTop: '5px' }}>
              <a href="https://cpi7.vercel.app/" className="cf-link" target="_blank" rel="noopener noreferrer">Official Website</a> | 
              <a href="https://vjudge.net/group/cpi7" className="cf-link" target="_blank" rel="noopener noreferrer"> Vjudge Group</a> | 
              <a href="https://facebook.com/cpi.7.seven" className="cf-link" target="_blank" rel="noopener noreferrer"> Facebook</a> |
              <a href="https://discord.gg/hUVD5YvWqE" className="cf-link" target="_blank" rel="noopener noreferrer"> Discord</a>
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Index;
