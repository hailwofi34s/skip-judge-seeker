
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

  return (
    <div style={{ background: '#f8f8f8', minHeight: '100vh', fontFamily: 'Helvetica, Arial, sans-serif', fontSize: '13px' }}>
      {/* Top Header */}
      <div style={{ background: '#0066FF', color: 'white', padding: '8px 0', fontSize: '13px' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '18px', height: '18px', background: 'white', borderRadius: '2px', display: 'flex' }}>
                <div style={{ width: '6px', height: '18px', background: '#ff6347' }}></div>
                <div style={{ width: '6px', height: '18px', background: '#4169e1' }}></div>
                <div style={{ width: '6px', height: '18px', background: '#ffd700' }}></div>
              </div>
              <span style={{ fontSize: '18px', fontWeight: 'bold', marginLeft: '5px' }}>CODEFORCES</span>
              <span style={{ fontSize: '11px', color: '#cccccc', marginLeft: '5px' }}>Sponsored by TON</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '12px' }}>
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="EN" style={{ width: '16px', height: '11px' }} />
            <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="RU" style={{ width: '16px', height: '11px' }} />
            <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Enter</a>
            <span>|</span>
            <a href="#" style={{ color: 'white', textDecoration: 'none' }}>Register</a>
          </div>
        </div>
      </div>

      {/* Navigation Bar */}
      <div style={{ background: 'white', borderBottom: '1px solid #ddd' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '0' }}>
              {['HOME', 'TOP', 'CATALOG', 'CONTESTS', 'GYM', 'PROBLEMSET', 'GROUPS', 'RATING', 'EDU', 'API', 'CALENDAR', 'HELP'].map((item, index) => (
                <div
                  key={item}
                  style={{
                    padding: '12px 15px',
                    borderBottom: item === 'HOME' ? '3px solid #0066FF' : '3px solid transparent',
                    fontSize: '12px',
                    fontWeight: item === 'HOME' ? 'bold' : 'normal',
                    color: item === 'HOME' ? '#0066FF' : '#333',
                    cursor: 'pointer',
                    textDecoration: 'none'
                  }}
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
          <div style={{ padding: '8px' }}>
            <input
              type="text"
              placeholder=""
              style={{
                border: '1px solid #ccc',
                padding: '4px 8px',
                fontSize: '12px',
                width: '120px',
                borderRadius: '2px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '10px', display: 'flex', gap: '10px' }}>
        
        {/* Left Main Content */}
        <div style={{ flex: '1', minWidth: '0' }}>
          
          {/* Cheater Detector Section */}
          <div style={{ background: 'white', border: '1px solid #ddd', marginBottom: '10px' }}>
            <div style={{ background: '#f0f0f0', borderBottom: '1px solid #ddd', padding: '8px 12px', fontWeight: 'bold', color: '#333' }}>
              🔍 CPI7 Cheater Detector
            </div>
            <div style={{ padding: '12px' }}>
              <div style={{ marginBottom: '15px', fontSize: '12px', color: '#666' }}>
                Analyze Codeforces submissions for suspicious cheating patterns
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '15px' }}>
                <input
                  type="text"
                  placeholder="Enter Codeforces username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && analyzeUser()}
                  style={{
                    border: '1px solid #ccc',
                    padding: '4px 6px',
                    fontSize: '12px',
                    fontFamily: 'Helvetica, Arial, sans-serif',
                    flex: 1,
                    minWidth: '200px'
                  }}
                />
                <button 
                  onClick={analyzeUser} 
                  disabled={loading}
                  style={{
                    background: '#0066FF',
                    color: 'white',
                    border: 'none',
                    padding: '6px 12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    borderRadius: '2px'
                  }}
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>

              {/* User Info */}
              {userInfo && (
                <div style={{ background: '#f8f8f8', border: '1px solid #ddd', padding: '8px', marginBottom: '10px', fontSize: '12px' }}>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Handle:</strong> <span style={{ fontWeight: 'bold' }}>{userInfo.handle}</span>
                  </div>
                  <div style={{ marginBottom: '4px' }}>
                    <strong>Rating:</strong> <span className={getRatingClass(userInfo.rating)} style={{ fontWeight: 'bold' }}>
                      {userInfo.rating || 'Unrated'}
                    </span>
                  </div>
                  <div>
                    <strong>Max Rating:</strong> <span className={getRatingClass(userInfo.maxRating)} style={{ fontWeight: 'bold' }}>
                      {userInfo.maxRating || 'Unrated'}
                    </span>
                  </div>
                </div>
              )}

              {/* Results */}
              {result && (
                <div style={{ background: '#f8f8f8', border: '1px solid #ddd', padding: '8px', fontSize: '12px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
                    <div><strong>Total Submissions:</strong> {result.totalSubmissions}</div>
                    <div><strong>Skipped:</strong> <span style={{ color: '#cc0000', fontWeight: 'bold' }}>{result.skippedSubmissions}</span></div>
                    <div><strong>Skipped %:</strong> <span style={{ color: '#cc0000', fontWeight: 'bold' }}>{result.skippedPercentage.toFixed(1)}%</span></div>
                    <div><strong>Status:</strong> 
                      <span style={{
                        background: result.isCheat ? '#ffcccc' : '#ccffcc',
                        color: result.isCheat ? '#cc0000' : '#008800',
                        padding: '2px 4px',
                        fontSize: '11px',
                        fontWeight: 'bold',
                        borderRadius: '2px',
                        marginLeft: '4px'
                      }}>
                        {result.isCheat ? "SUSPICIOUS" : "CLEAN"}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{ 
                    padding: '6px', 
                    background: result.isCheat ? '#fff0f0' : '#f0fff0',
                    border: `1px solid ${result.isCheat ? '#ffcccc' : '#ccffcc'}`,
                    fontSize: '11px',
                    borderRadius: '2px'
                  }}>
                    {result.isCheat 
                      ? '⚠️ Suspicious activity detected! Skipped verdicts may indicate plagiarism.'
                      : '✅ No suspicious activity detected.'}
                  </div>
                </div>
              )}

              {/* Suspicious Submissions Table */}
              {result?.isCheat && result.suspiciousSubmissions.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '5px', fontSize: '12px' }}>
                    Skipped Submissions ({result.suspiciousSubmissions.length})
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                    <thead>
                      <tr style={{ background: '#f8f8f8' }}>
                        <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold' }}>Problem</th>
                        <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold' }}>Contest</th>
                        <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold' }}>Language</th>
                        <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold' }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.suspiciousSubmissions.slice(0, 5).map((submission) => (
                        <tr key={submission.id} style={{ background: 'white' }}>
                          <td style={{ border: '1px solid #ddd', padding: '4px 6px' }}>
                            <div style={{ fontWeight: 'bold' }}>{submission.problem.name}</div>
                            <div style={{ color: '#666', fontSize: '10px' }}>Problem {submission.problem.index}</div>
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '4px 6px' }}>
                            {submission.problem.contestId ? (
                              <a href={`https://codeforces.com/contest/${submission.problem.contestId}`} 
                                 style={{ color: '#0066FF', textDecoration: 'none' }} target="_blank" rel="noopener noreferrer">
                                Contest {submission.problem.contestId}
                              </a>
                            ) : (
                              <span style={{ color: '#999' }}>Practice</span>
                            )}
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '4px 6px' }}>
                            <span style={{ 
                              background: '#f0f0f0', 
                              padding: '1px 3px', 
                              fontSize: '10px',
                              fontFamily: 'monospace'
                            }}>
                              {submission.programmingLanguage}
                            </span>
                          </td>
                          <td style={{ border: '1px solid #ddd', padding: '4px 6px', fontSize: '10px', color: '#666' }}>
                            {formatDate(submission.creationTimeSeconds)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Main Blog Post */}
          <div style={{ background: 'white', border: '1px solid #ddd', marginBottom: '10px' }}>
            <div style={{ padding: '15px' }}>
              <h1 style={{ 
                fontSize: '24px', 
                color: '#0066FF', 
                marginBottom: '10px', 
                fontWeight: 'normal',
                textDecoration: 'none'
              }}>
                CPI7 Competitive Programming Team
              </h1>
              
              <div style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>
                By <span style={{ color: '#cc0000', fontWeight: 'bold' }}>CPI7</span>, 
                <a href="#" style={{ color: '#0066FF', textDecoration: 'none', marginLeft: '5px' }}>team</a>, 1 hour ago, 
                <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" alt="BD" style={{ width: '16px', height: '11px', marginLeft: '5px' }} />
              </div>

              <div style={{ lineHeight: '1.4', fontSize: '13px', marginBottom: '15px' }}>
                <p style={{ marginBottom: '10px' }}>Hello everyone!</p>
                
                <p style={{ marginBottom: '10px' }}>
                  Welcome to <strong>CPI7 - Competitive Programming Team</strong> at Cumilla Polytechnic Institute. 
                  We're a passionate group of programmers dedicated to mastering algorithms and data structures.
                </p>

                <p style={{ marginBottom: '10px' }}>
                  Our team specializes in competitive programming, participating in various contests including 
                  <a href="#" style={{ color: '#0066FF', textDecoration: 'none' }}> Codeforces</a>, 
                  <a href="#" style={{ color: '#0066FF', textDecoration: 'none' }}> AtCoder</a>, and 
                  <a href="#" style={{ color: '#0066FF', textDecoration: 'none' }}> CodeChef</a>. 
                  We believe in continuous learning and strategic problem-solving.
                </p>

                <p style={{ marginBottom: '15px' }}>
                  <strong>What we offer:</strong>
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                  <li>Regular practice sessions and contest participation</li>
                  <li>Algorithm and data structure workshops</li>
                  <li>Team collaboration and peer learning</li>
                  <li>Contest strategy and problem-solving techniques</li>
                </ul>

                <p style={{ marginBottom: '15px' }}>
                  Join our community and let's solve complex problems together through strategic thinking and algorithmic excellence.
                </p>

                <p style={{ marginBottom: '10px' }}>
                  <strong>Connect with us:</strong>
                </p>
                <ul style={{ marginLeft: '20px', marginBottom: '15px' }}>
                  <li><a href="https://vjudge.net/group/cpi7" style={{ color: '#0066FF', textDecoration: 'none' }}>Vjudge Group</a></li>
                  <li><a href="https://facebook.com/cpi.7.seven" style={{ color: '#0066FF', textDecoration: 'none' }}>Facebook Page</a></li>
                  <li><a href="https://discord.gg/hUVD5YvWqE" style={{ color: '#0066FF', textDecoration: 'none' }}>Discord Server</a></li>
                  <li><a href="https://cpi7.vercel.app/" style={{ color: '#0066FF', textDecoration: 'none' }}>Official Website</a></li>
                </ul>

                <p>
                  <strong>Based in Bangladesh</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div style={{ width: '280px', flexShrink: 0 }}>
          
          {/* Pay Attention Box */}
          <div style={{ background: 'white', border: '1px solid #ddd', marginBottom: '10px' }}>
            <div style={{ background: '#f0f0f0', borderBottom: '1px solid #ddd', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              → Pay attention
            </div>
            <div style={{ padding: '10px', fontSize: '12px' }}>
              <div style={{ textAlign: 'center', marginBottom: '8px' }}>
                <strong>Before contest</strong>
              </div>
              <div style={{ textAlign: 'center' }}>
                <a href="#" style={{ color: '#0066FF', textDecoration: 'none', fontSize: '11px' }}>
                  CPI7 Practice Round (Div. 2)
                </a>
              </div>
              <div style={{ textAlign: 'center', fontSize: '11px', color: '#666' }}>
                6 days
              </div>
            </div>
          </div>

          {/* Top Rated */}
          <div style={{ background: 'white', border: '1px solid #ddd', marginBottom: '10px' }}>
            <div style={{ background: '#f0f0f0', borderBottom: '1px solid #ddd', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              → Top rated
            </div>
            <div style={{ padding: '0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8' }}>
                    <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold', width: '25px' }}>#</th>
                    <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold' }}>User</th>
                    <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', width: '60px' }}>Rating</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rank: 1, handle: 'jiangly', rating: 3756, color: 'cf-rating-grandmaster' },
                    { rank: 2, handle: 'tourist', rating: 3723, color: 'cf-rating-grandmaster' },
                    { rank: 3, handle: 'orzdevinwang', rating: 3696, color: 'cf-rating-grandmaster' },
                    { rank: 4, handle: 'Kevin114514', rating: 3647, color: 'cf-rating-grandmaster' },
                    { rank: 5, handle: 'Radewoosh', rating: 3631, color: 'cf-rating-grandmaster' },
                    { rank: 6, handle: 'ecnerwala', rating: 3596, color: 'cf-rating-grandmaster' },
                  ].map((user) => (
                    <tr key={user.rank} style={{ background: 'white' }}>
                      <td style={{ border: '1px solid #ddd', padding: '3px 6px', textAlign: 'center' }}>{user.rank}</td>
                      <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>
                        <a href="#" className={user.color} style={{ textDecoration: 'none', fontWeight: 'bold' }}>
                          {user.handle}
                        </a>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '3px 6px', textAlign: 'right' }}>{user.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ padding: '6px 10px', borderTop: '1px solid #ddd', fontSize: '11px', textAlign: 'center' }}>
                <a href="#" style={{ color: '#0066FF', textDecoration: 'none', marginRight: '10px' }}>Countries</a>
                <a href="#" style={{ color: '#0066FF', textDecoration: 'none', marginRight: '10px' }}>Cities</a>
                <a href="#" style={{ color: '#0066FF', textDecoration: 'none', marginRight: '10px' }}>Organizations</a>
                <a href="#" style={{ color: '#0066FF', textDecoration: 'none' }}>View all →</a>
              </div>
            </div>
          </div>

          {/* Top Contributors */}
          <div style={{ background: 'white', border: '1px solid #ddd', marginBottom: '10px' }}>
            <div style={{ background: '#f0f0f0', borderBottom: '1px solid #ddd', padding: '6px 10px', fontSize: '12px', fontWeight: 'bold', color: '#333' }}>
              → Top contributors
            </div>
            <div style={{ padding: '0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
                <thead>
                  <tr style={{ background: '#f8f8f8' }}>
                    <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'center', fontWeight: 'bold', width: '25px' }}>#</th>
                    <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'left', fontWeight: 'bold' }}>User</th>
                    <th style={{ border: '1px solid #ddd', padding: '4px 6px', textAlign: 'right', fontWeight: 'bold', width: '50px' }}>Contrib.</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { rank: 1, handle: 'errorgorn', contrib: 169, color: 'cf-rating-grandmaster' },
                    { rank: 2, handle: 'Qingyu', contrib: 165, color: 'cf-rating-master' },
                    { rank: 3, handle: 'Dominater069', contrib: 159, color: 'cf-rating-grandmaster' },
                  ].map((user) => (
                    <tr key={user.rank} style={{ background: 'white' }}>
                      <td style={{ border: '1px solid #ddd', padding: '3px 6px', textAlign: 'center' }}>{user.rank}</td>
                      <td style={{ border: '1px solid #ddd', padding: '3px 6px' }}>
                        <a href="#" className={user.color} style={{ textDecoration: 'none', fontWeight: 'bold' }}>
                          {user.handle}
                        </a>
                      </td>
                      <td style={{ border: '1px solid #ddd', padding: '3px 6px', textAlign: 'right' }}>{user.contrib}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Index;
