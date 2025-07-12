
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
    <div className="cf-content">
      {/* Header - Exact Codeforces style */}
      <div className="cf-header" style={{ padding: '8px 0', fontSize: '13px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', padding: '0 10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '16px', fontWeight: 'bold' }}>CPI7 Cheater Detector</span>
            </div>
            <div style={{ fontSize: '11px' }}>
              Analyze Codeforces submissions for cheating patterns
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '10px' }}>
        {/* Search Section */}
        <div className="cf-white-box">
          <div className="cf-box-header">Enter Username</div>
          <div className="cf-box-content">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input
                className="cf-input"
                placeholder="Enter Codeforces username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeUser()}
                style={{ flex: 1, minWidth: '200px' }}
              />
              <button 
                className="cf-button"
                onClick={analyzeUser} 
                disabled={loading}
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </button>
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

        {/* Info Section */}
        <div className="cf-white-box">
          <div className="cf-box-header">How it works</div>
          <div className="cf-box-content">
            <div style={{ fontSize: '12px', lineHeight: '1.5' }}>
              <div>• This tool analyzes Codeforces submissions to detect potential cheating</div>
              <div>• "SKIPPED" verdicts often indicate plagiarism detected by Codeforces</div>
              <div>• The analysis is based on publicly available Codeforces API data</div>
              <div>• Multiple skipped submissions may indicate suspicious activity</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
