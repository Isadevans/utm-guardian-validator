import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Copy, CheckCircle, XCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AdValidationError } from "@/pages/Index"; // Import types from Index.tsx

enum ValidationErrors {
  MISSING_UTM_FIELD = 'MISSING_UTM_FIELD',
  INCORRECT_UTM_FORMAT = 'INCORRECT_UTM_FORMAT',
  CAMPAIGN_WITH_TRACKING_PARAMS = 'CAMPAIGN_WITH_TRACKING_PARAMS',
  ADGROUP_WITH_TRACKING_PARAMS = 'ADGROUP_WITH_TRACKING_PARAMS',
  UTM_IN_LINK_URL = 'UTM_IN_LINK_URL'
}
interface UtmDebuggerProps {
  errors: AdValidationError[];
  requiredPattern?: string; // Make requiredPattern optional
}

const DEFAULT_PATTERN = "utm_source=SOURCE&utm_medium=MEDIUM&utm_campaign=CAMPAIGN&utm_content=CONTENT";

const parseUtmString = (utmString: string) => {
  const params = new URLSearchParams(utmString.replace(/^\?/, ''));
  return {
    utm_source: params.get('utm_source') || '',
    utm_campaign: params.get('utm_campaign') || '',
    utm_medium: params.get('utm_medium') || '',
    utm_content: params.get('utm_content') || '',
    utm_term: params.get('utm_term') || ''
  };
};

const UtmComparison = ({ found, expected }: { found: string; expected: string }) => {
  const foundParams = parseUtmString(found);
  const expectedParams = parseUtmString(expected);

  const paramKeys = ['utm_source', 'utm_campaign', 'utm_medium', 'utm_content', 'utm_term'];

  return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-red-600 font-medium">Found UTMs</Label>
            <div className="mt-2 p-3 bg-red-50 rounded-lg border border-red-200">
              <pre className="text-xs break-all whitespace-pre-wrap">{found}</pre>
            </div>
          </div>
          <div>
            <Label className="text-green-600 font-medium">Expected UTMs</Label>
            <div className="mt-2 p-3 bg-green-50 rounded-lg border border-green-200">
              <pre className="text-xs break-all whitespace-pre-wrap">{expected}</pre>
            </div>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <Label className="font-medium">Parameter Comparison</Label>
          <div className="space-y-2">
            {paramKeys.map((key) => {
              const foundValue = foundParams[key as keyof typeof foundParams];
              const expectedValue = expectedParams[key as keyof typeof expectedParams];
              const isMatch = foundValue === expectedValue;

              if (!foundValue && !expectedValue) return null;

              return (
                  <div key={key} className="grid grid-cols-3 gap-2 items-center text-sm">
                    <div className="font-mono font-medium">{key}:</div>
                    <div className={`p-2 rounded text-xs break-all ${
                        isMatch ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {foundValue || '(missing)'}
                    </div>
                    <div className="flex items-center gap-2">
                      {isMatch ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                          <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-xs text-muted-foreground">
                    {isMatch ? 'Match' : 'Mismatch'}
                  </span>
                    </div>
                  </div>
              );
            })}
          </div>
        </div>
      </div>
  );
};

const UtmTester = ({ requiredPattern }: { requiredPattern: string }) => {
  const [testUtm, setTestUtm] = useState("");
  const [testResult, setTestResult] = useState<{ isValid: boolean; message: string } | null>(null);
  const { toast } = useToast();

  const testUtmString = () => {
    if (!testUtm.trim()) {
      setTestResult({ isValid: false, message: "Please enter a UTM string to test" });
      return;
    }

    const isValid = testUtm.trim() === requiredPattern;
    setTestResult({
      isValid,
      message: isValid
          ? "✅ UTM string matches the required pattern!"
          : "❌ UTM string does not match the required pattern"
    });
  };

  const copyPattern = async () => {
    try {
      await navigator.clipboard.writeText(requiredPattern);
      toast({
        title: "Copied!",
        description: "Required UTM pattern copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="test-utm">Test UTM String</Label>
          <div className="mt-2 flex gap-2">
            <Input
                id="test-utm"
                placeholder="Paste your UTM string here..."
                value={testUtm}
                onChange={(e) => setTestUtm(e.target.value)}
                className="flex-1"
            />
            <Button onClick={testUtmString} variant="outline">
              <Search className="h-4 w-4 mr-2" />
              Test
            </Button>
          </div>
        </div>

        {testResult && (
            <div className={`p-3 rounded-lg border ${
                testResult.isValid
                    ? 'bg-green-50 border-green-200 text-green-800'
                    : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              {testResult.message}
            </div>
        )}

        <Separator />

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label>Required Pattern</Label>
            <Button onClick={copyPattern} variant="outline" size="sm">
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
          </div>
          <div className="p-3 bg-gray-50 rounded-lg border">
            <pre className="text-xs break-all whitespace-pre-wrap">{requiredPattern}</pre>
          </div>
        </div>

        {testUtm && testResult && !testResult.isValid && (
            <>
              <Separator />
              <UtmComparison found={testUtm} expected={requiredPattern} />
            </>
        )}
      </div>
  );
};

// Helper to determine a pattern from error data when requiredPattern is not provided
const inferPatternFromErrors = (errors: AdValidationError[]): string => {
  // Try to find an error with expected_utms
  const errorWithExpected = errors.find(e => e.expected_utms);
  if (errorWithExpected?.expected_utms) {
    return errorWithExpected.expected_utms;
  }

  // If no expected UTMs are found, return default pattern
  return DEFAULT_PATTERN;
};

export const UtmDebugger = ({ errors, requiredPattern }: UtmDebuggerProps) => {
  // Use provided requiredPattern or infer from errors
  const actualPattern = requiredPattern || inferPatternFromErrors(errors);

  // Get unique error types
  const errorTypes = [...new Set(errors.map(e => e.error_type))];

  return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>UTM Testing & Debugging</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={errors.some(e => e.found_utms && e.expected_utms) ? "comparisons" : "patterns"}>
              <TabsList>
                <TabsTrigger value="tester">UTM Tester</TabsTrigger>
                <TabsTrigger value="comparisons">Error Comparisons</TabsTrigger>
                <TabsTrigger value="patterns">Error Patterns</TabsTrigger>
              </TabsList>

              <TabsContent value="tester" className="mt-4">
                <UtmTester requiredPattern={actualPattern} />
              </TabsContent>

              <TabsContent value="comparisons" className="mt-4">
                <div className="space-y-6">
                  {errors.filter(e => e.found_utms && e.expected_utms).map((error) => (
                      <Card key={`${error.platform}-${error.id}`}>
                        <CardHeader>
                          <CardTitle className="text-sm flex items-center gap-2">
                            {error.name}
                            <Badge variant="outline">{error.platform}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <UtmComparison
                              found={error.found_utms!}
                              expected={error.expected_utms!}
                          />
                        </CardContent>
                      </Card>
                  ))}
                  {errors.filter(e => e.found_utms && e.expected_utms).length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No errors with UTM comparisons available
                      </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="patterns" className="mt-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {errorTypes.map((errorType) => {
                      const errorCount = errors.filter(e => e.error_type === errorType).length;
                      // Convert error type to display string
                      const displayError = typeof errorType === 'string'
                          ? errorType
                          : ValidationErrors[errorType as unknown as number] || String(errorType);

                      return (
                          <Card key={displayError}>
                            <CardContent className="pt-4">
                              <div className="text-center">
                                <div className="text-2xl font-bold">{errorCount}</div>
                                <div className="text-sm text-muted-foreground">{displayError}</div>
                              </div>
                            </CardContent>
                          </Card>
                      );
                    })}
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Error Distribution by Platform</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {['Facebook', 'Google', 'TikTok', 'Pinterest'].map((platform) => {
                          const platformErrors = errors.filter(
                              e => e.platform.toLowerCase() === platform.toLowerCase()
                          );
                          return (
                              <div key={platform} className="flex items-center justify-between">
                                <span className="text-sm">{platform}</span>
                                <Badge variant="outline">{platformErrors.length} errors</Badge>
                              </div>
                          );
                        })}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
  );
};