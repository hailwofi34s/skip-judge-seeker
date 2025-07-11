import React, { useState } from 'react';
import { Search, Shield, AlertTriangle, CheckCircle, User, Calendar, Code } from 'lucide-react';
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-3 mb-4">
            <Shield className="h-10 w-10 text-indigo-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Codeforces Cheater Detector
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Analyze user submissions to detect potential cheating patterns
          </p>
        </div>

        {/* Search Section */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Enter Username
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Input
                placeholder="Enter Codeforces username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && analyzeUser()}
                className="flex-1"
              />
              <Button 
                onClick={analyzeUser} 
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {loading ? 'Analyzing...' : 'Analyze'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* User Info */}
        {userInfo && (
          <Card className="mb-6 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="font-semibold text-gray-700">Handle</p>
                  <p className="text-lg">{userInfo.handle}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Rating</p>
                  <p className={`text-lg font-bold ${getRatingColor(userInfo.rating)}`}>
                    {userInfo.rating || 'Unrated'}
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-gray-700">Max Rating</p>
                  <p className={`text-lg font-bold ${getRatingColor(userInfo.maxRating)}`}>
                    {userInfo.maxRating || 'Unrated'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Analysis Summary */}
            <Card className={`shadow-lg border-0 ${result.isCheat ? 'bg-red-50' : 'bg-green-50'}`}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.isCheat ? (
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  ) : (
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  )}
                  Analysis Result
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-800">{result.totalSubmissions}</p>
                    <p className="text-sm text-gray-600">Total Submissions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{result.skippedSubmissions}</p>
                    <p className="text-sm text-gray-600">Skipped Submissions</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">{result.skippedPercentage.toFixed(1)}%</p>
                    <p className="text-sm text-gray-600">Skipped Percentage</p>
                  </div>
                  <div className="text-center">
                    <Badge variant={result.isCheat ? "destructive" : "default"} className="text-lg px-4 py-2">
                      {result.isCheat ? "SUSPICIOUS" : "CLEAN"}
                    </Badge>
                  </div>
                </div>
                
                <div className={`p-4 rounded-lg ${result.isCheat ? 'bg-red-100' : 'bg-green-100'}`}>
                  <p className={`font-semibold ${result.isCheat ? 'text-red-800' : 'text-green-800'}`}>
                    {result.isCheat 
                      ? '⚠️ This user has suspicious activity! Skipped verdicts often indicate plagiarism detection.'
                      : '✅ No suspicious activity detected. This user appears to be clean.'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Suspicious Submissions Table */}
            {result.isCheat && result.suspiciousSubmissions.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Skipped Submissions ({result.suspiciousSubmissions.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Problem</TableHead>
                        <TableHead>Contest</TableHead>
                        <TableHead>Language</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.suspiciousSubmissions.map((submission) => (
                        <TableRow key={submission.id} className="bg-red-50/50">
                          <TableCell>
                            <div>
                              <p className="font-medium text-gray-900">{submission.problem.name}</p>
                              <p className="text-sm text-gray-500">Problem {submission.problem.index}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {submission.problem.contestId ? (
                              <span className="text-sm text-gray-600">Contest {submission.problem.contestId}</span>
                            ) : (
                              <span className="text-sm text-gray-400">No Contest</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                              {submission.programmingLanguage}
                            </span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-3 w-3" />
                              {formatDate(submission.creationTimeSeconds)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {submission.problem.rating ? (
                              <span className={`text-sm font-semibold ${getRatingColor(submission.problem.rating)}`}>
                                {submission.problem.rating}
                              </span>
                            ) : (
                              <span className="text-sm text-gray-400">Unrated</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="destructive">SKIPPED</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Info Section */}
        <Card className="mt-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-600">
              <p>• This tool analyzes Codeforces submissions to detect potential cheating</p>
              <p>• "SKIPPED" verdicts often indicate plagiarism detected by Codeforces</p>
              <p>• The analysis is based on publicly available Codeforces API data</p>
              <p>• Multiple skipped submissions may indicate suspicious activity</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
