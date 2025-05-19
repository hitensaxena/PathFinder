
"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { generateQuiz, type GenerateQuizInput, type QuizQuestion } from '@/ai/flows/generate-quiz-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/spinner';
import { AlertCircle, CheckCircle, ChevronLeft, Home } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

type UserAnswers = { [questionIndex: number]: number }; // questionIndex: selectedOptionIndex

function QuizPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const moduleTitle = searchParams.get('moduleTitle');
  const moduleDescription = searchParams.get('moduleDescription');
  const learningGoal = searchParams.get('learningGoal');

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  useEffect(() => {
    if (!moduleTitle || !moduleDescription || !learningGoal) {
      setError("Missing necessary parameters to generate the quiz. Please go back and try again.");
      setIsLoading(false);
      toast({
        title: "Quiz Error",
        description: "Could not load quiz due to missing module information.",
        variant: "destructive"
      });
      return;
    }

    const fetchQuiz = async () => {
      setIsLoading(true);
      setError(null);
      setSubmitted(false);
      setUserAnswers({});
      setScore(0);
      try {
        const input: GenerateQuizInput = { moduleTitle, moduleDescription };
        const result = await generateQuiz(input);
        setQuestions(result.questions);
      } catch (e) {
        console.error("Error generating quiz:", e);
        const errorMessage = e instanceof Error ? e.message : "An unexpected error occurred while generating the quiz.";
        setError(errorMessage);
        toast({
          title: "Quiz Generation Failed",
          description: errorMessage,
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuiz();
  }, [moduleTitle, moduleDescription, learningGoal, toast]);

  const handleAnswerChange = (questionIndex: number, optionIndex: number) => {
    setUserAnswers(prev => ({ ...prev, [questionIndex]: optionIndex }));
  };

  const handleSubmitQuiz = () => {
    let correctAnswers = 0;
    questions.forEach((q, index) => {
      if (userAnswers[index] === q.correctAnswerIndex) {
        correctAnswers++;
      }
    });
    setScore((correctAnswers / questions.length) * 100);
    setSubmitted(true);
    toast({
      title: "Quiz Submitted!",
      description: `You scored ${((correctAnswers / questions.length) * 100).toFixed(0)}%.`,
    });
  };

  const handleGoBack = () => {
    // Heuristic: if there's history, go back, else go to homepage
    if (window.history.length > 2) { // 2 because current page and previous
      router.back();
    } else {
      router.push('/');
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Spinner className="h-12 w-12 text-primary" />
        <p className="mt-4 text-muted-foreground">Generating your quiz...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-2xl mx-auto my-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Quiz</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
        <div className="mt-4">
            <Button onClick={handleGoBack} variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
      </Alert>
    );
  }

  if (questions.length === 0) {
    return (
      <Alert className="max-w-2xl mx-auto my-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Questions</AlertTitle>
        <AlertDescription>The AI couldn't generate questions for this module at the moment. Please try again later.</AlertDescription>
         <div className="mt-4">
            <Button onClick={handleGoBack} variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
      </Alert>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader>
          <Button onClick={handleGoBack} variant="outline" size="sm" className="absolute top-4 left-4">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Path
          </Button>
          <CardTitle className="text-2xl md:text-3xl text-center pt-8">Quiz: {moduleTitle}</CardTitle>
          <CardDescription className="text-center text-base">
            Test your understanding of the key concepts from this module.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {questions.map((q, qIndex) => (
            <div key={qIndex} className={`p-6 rounded-lg border ${submitted && userAnswers[qIndex] === q.correctAnswerIndex ? 'border-green-500 bg-green-500/10' : submitted && userAnswers[qIndex] !== undefined ? 'border-red-500 bg-red-500/10' : 'bg-background'}`}>
              <p className="font-semibold text-lg mb-3">Question {qIndex + 1}: {q.questionText}</p>
              <RadioGroup
                onValueChange={(value) => handleAnswerChange(qIndex, parseInt(value))}
                value={userAnswers[qIndex]?.toString()}
                disabled={submitted}
                className="space-y-2"
              >
                {q.options.map((option, oIndex) => (
                  <div key={oIndex} className={`flex items-center space-x-3 p-3 rounded-md border transition-colors ${submitted && oIndex === q.correctAnswerIndex ? 'border-green-600 bg-green-500/20 text-green-800 font-medium' : submitted && userAnswers[qIndex] === oIndex && oIndex !== q.correctAnswerIndex ? 'border-red-600 bg-red-500/20 text-red-800' : 'hover:bg-muted/50'}`}>
                    <RadioGroupItem value={oIndex.toString()} id={`q${qIndex}-o${oIndex}`} className="shrink-0" />
                    <Label htmlFor={`q${qIndex}-o${oIndex}`} className="flex-grow cursor-pointer text-base">
                      {option}
                      {submitted && oIndex === q.correctAnswerIndex && <span className="ml-2 text-green-700 font-semibold">(Correct Answer)</span>}
                      {submitted && userAnswers[qIndex] === oIndex && oIndex !== q.correctAnswerIndex && <span className="ml-2 text-red-700 font-semibold">(Your Answer)</span>}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
              {submitted && q.explanation && (
                <p className="text-sm mt-3 pt-3 border-t text-muted-foreground">
                  <span className="font-semibold">Explanation:</span> {q.explanation}
                </p>
              )}
            </div>
          ))}
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-4 pt-8">
          {!submitted ? (
             <Button onClick={handleSubmitQuiz} size="lg" className="w-full sm:w-auto">
              Submit Quiz
            </Button>
          ) : (
            <div className="text-center p-6 bg-primary/10 rounded-lg w-full">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-2xl font-semibold mb-2">Quiz Complete!</h3>
              <p className="text-3xl font-bold text-primary mb-1">Your Score: {score.toFixed(0)}%</p>
              <p className="text-muted-foreground mb-4">
                {score >= 75 ? "Congratulations! You passed." : "Keep learning and try again!"}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button onClick={() => {
                  setIsLoading(true); // To re-trigger useEffect
                  // A slight delay to ensure state change is picked up by useEffect dependency array for re-fetch
                  setTimeout(() => {
                    if (moduleTitle && moduleDescription && learningGoal) {
                        const fetchQuiz = async () => {
                            setIsLoading(true); setError(null); setSubmitted(false); setUserAnswers({}); setScore(0);
                            try {
                                const input: GenerateQuizInput = { moduleTitle, moduleDescription };
                                const result = await generateQuiz(input);
                                setQuestions(result.questions);
                            } catch (e) {
                                const errorMessage = e instanceof Error ? e.message : "An error occurred.";
                                setError(errorMessage);
                                toast({title: "Quiz Retake Error", description: errorMessage, variant: "destructive"});
                            } finally { setIsLoading(false); }
                        };
                        fetchQuiz();
                    } else {
                        setError("Cannot retake quiz due to missing module information.");
                        setIsLoading(false);
                    }
                  }, 100);
                  }} 
                  variant="outline"
                >
                  Retake Quiz
                </Button>
                <Button onClick={handleGoBack} >
                  Back to Learning Path
                </Button>
              </div>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}


export default function QuizPage() {
  return (
    // Suspense boundary is good practice for pages using useSearchParams
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    }>
      <QuizPageContent />
    </Suspense>
  );
}
