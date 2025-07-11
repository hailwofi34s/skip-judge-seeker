import React, { useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, User, Calendar, Code, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
    return new Date(seconds * 1000).toLocaleDateString();
  };

  const getRatingColor = (rating?: number) => {
    if (!rating) return 'text-gray-500';
    if (rating < 1200) return 'text-gray-600';
    if (rating < 1400) return 'text-green-600';
    if (rating < 1600) return 'text-cyan-600';
    if (rating < 1900) return 'text-blue-600';
    if (rating < 2100) return 'text-purple-600';
    if (rating < 2400) return 'text-orange-600';
    return 'text-red-600';
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
    <div className="min-h-screen bg-gray-50">
      {/* Header - Codeforces style */}
      <div className="bg-blue-600 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <h1 className="text-2xl font-bold">CPI7 Cheater Detector</h1>
            </div>
            <div className="text-sm">
              Analyze Codeforces submissions for cheating patterns
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Search Section - Codeforces style */}
        <div className="bg-white border border-gray-200 rounded mb-6 shadow-sm">
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Search className="h-4 w-4" />
              Enter Username
            </h2>
          </div>
          <div className="p-4">
            <div className="flex gap-3">
              <Input
                placeholder="Enter Codeforces username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeUser()}
                className="flex-1 border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              />
              <Button 
                onClick={analyzeUser} 
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
          </div>
        </div>

        {/* User Info - Codeforces style */}
        {userInfo && (
          <div className="bg-white border border-gray-200 rounded mb-6 shadow-sm">
            <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <User className="h-4 w-4" />
                User Information
              </h2>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-gray-600 text-sm">Handle:</span>
                  <div className="font-semibold text-lg">{userInfo.handle}</div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Rating:</span>
                  <div className={`font-bold text-lg ${getRatingColor(userInfo.rating)}`}>
                    {userInfo.rating || 'Unrated'}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600 text-sm">Max Rating:</span>
                  <div className={`font-bold text-lg ${getRatingColor(userInfo.maxRating)}`}>
                    {userInfo.maxRating || 'Unrated'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Analysis Summary - Codeforces style */}
            <div className={`bg-white border rounded shadow-sm ${result.isCheat ? 'border-red-300' : 'border-green-300'}`}>
              <div className={`border-b px-4 py-2 ${result.isCheat ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  {result.isCheat ? (
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  ) : (
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  )}
                  Analysis Result
                </h2>
              </div>
              <div className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <div className="text-2xl font-bold text-gray-800">{result.totalSubmissions}</div>
                    <div className="text-sm text-gray-600">Total Submissions</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded">
                    <div className="text-2xl font-bold text-red-600">{result.skippedSubmissions}</div>
                    <div className="text-sm text-gray-600">Skipped Submissions</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded">
                    <div className="text-2xl font-bold text-orange-600">{result.skippedPercentage.toFixed(1)}%</div>
                    <div className="text-sm text-gray-600">Skipped Percentage</div>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded">
                    <span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                      result.isCheat 
                        ? 'bg-red-100 text-red-800 border border-red-200' 
                        : 'bg-green-100 text-green-800 border border-green-200'
                    }`}>
                      {result.isCheat ? "SUSPICIOUS" : "CLEAN"}
                    </span>
                  </div>
                </div>
                
                <div className={`p-3 rounded text-sm ${
                  result.isCheat 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
                  {result.isCheat 
                    ? '⚠️ This user has suspicious activity! Skipped verdicts often indicate plagiarism detection.'
                    : '✅ No suspicious activity detected. This user appears to be clean.'}
                </div>
              </div>
            </div>

            {/* Suspicious Submissions Table - Codeforces style */}
            {result.isCheat && result.suspiciousSubmissions.length > 0 && (
              <div className="bg-white border border-gray-200 rounded shadow-sm">
                <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
                  <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                    <Code className="h-4 w-4" />
                    Skipped Submissions ({result.suspiciousSubmissions.length})
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Problem</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Contest</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Language</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Rating</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                        <th className="text-left px-4 py-3 font-medium text-gray-600">Links</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.suspiciousSubmissions.map((submission, index) => (
                        <tr key={submission.id} className={`border-b border-gray-100 hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                          <td className="px-4 py-3">
                            <div>
                              <div className="font-medium text-blue-600 hover:text-blue-800">
                                {submission.problem.name}
                              </div>
                              <div className="text-xs text-gray-500">Problem {submission.problem.index}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {submission.problem.contestId ? (
                              <span className="text-blue-600">Contest {submission.problem.contestId}</span>
                            ) : (
                              <span className="text-gray-400">No Contest</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
                              {submission.programmingLanguage}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1 text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(submission.creationTimeSeconds)}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {submission.problem.rating ? (
                              <span className={`font-semibold ${getRatingColor(submission.problem.rating)}`}>
                                {submission.problem.rating}
                              </span>
                            ) : (
                              <span className="text-gray-400">Unrated</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-xs font-semibold border border-red-200">
                              SKIPPED
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <a
                                href={getSubmissionUrl(submission)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 px-2 py-1 rounded transition-colors border border-blue-200"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Sub
                              </a>
                              <a
                                href={getProblemUrl(submission)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition-colors border border-green-200"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Prob
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
          </div>
        )}

        {/* Info Section - Codeforces style */}
        <div className="bg-white border border-gray-200 rounded mt-6 shadow-sm">
          <div className="bg-gray-100 border-b border-gray-200 px-4 py-2">
            <h2 className="font-semibold text-gray-800">How it works</h2>
          </div>
          <div className="p-4">
            <div className="space-y-2 text-gray-700 text-sm">
              <p>• This tool analyzes Codeforces submissions to detect potential cheating</p>
              <p>• "SKIPPED" verdicts often indicate plagiarism detected by Codeforces</p>
              <p>• The analysis is based on publicly available Codeforces API data</p>
              <p>• Multiple skipped submissions may indicate suspicious activity</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
