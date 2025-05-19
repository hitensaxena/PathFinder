
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { generateQuiz, type GenerateQuizInput, type QuizQuestion } from '@/ai/flows/generate-quiz-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/spinner';
import { AlertCircle, CheckCircle, ChevronLeft, Home, Info, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress'; // For progress bar
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';


type UserAnswers = { [questionIndex: number]: number };

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
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | undefined>(undefined);


  const fetchQuiz = useCallback(async () => {
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

    setIsLoading(true);
    setError(null);
    setQuestions([]); // Clear previous questions
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setQuizCompleted(false);
    setScore(0);
    setSelectedOption(undefined);

    try {
      const input: GenerateQuizInput = { moduleTitle, moduleDescription };
      const result = await generateQuiz(input);
      if (result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
      } else {
        setError("The AI couldn't generate questions for this module at the moment. Please try again later.");
        toast({
          title: "No Questions Generated",
          description: "Please try again or select a different module.",
          variant: "destructive"
        });
      }
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
  // Ensure toast is stable or remove if it causes excessive reruns without actual need
  }, [moduleTitle, moduleDescription, learningGoal, toast]); 

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);


  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = () => {
    if (selectedOption === undefined) {
        toast({ title: "No option selected", description: "Please select an answer before proceeding.", variant: "destructive"});
        return;
    }

    const newAnswers = { ...userAnswers, [currentQuestionIndex]: selectedOption };
    setUserAnswers(newAnswers);
    setSelectedOption(undefined); // Reset for next question

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Last question answered, calculate score and complete quiz
      let correctAnswers = 0;
      questions.forEach((q, index) => {
        if (newAnswers[index] === q.correctAnswerIndex) {
          correctAnswers++;
        }
      });
      const finalScore = (correctAnswers / questions.length) * 100;
      setScore(finalScore);
      setQuizCompleted(true);
      toast({
        title: "Quiz Submitted!",
        description: `You scored ${finalScore.toFixed(0)}%.`,
      });
    }
  };


  const handleGoBack = () => {
    if (window.history.length > 2) { 
      router.back();
    } else {
      router.push('/');
    }
  };
  
  const handleRetakeQuiz = () => {
    fetchQuiz(); // This will reset state and fetch new questions
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

  if (questions.length === 0 && !isLoading) { // Check !isLoading to avoid showing this during initial load
    return (
      <Alert className="max-w-2xl mx-auto my-10">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Questions Available</AlertTitle>
        <AlertDescription>The AI couldn't generate questions for this module, or no questions were found. Please try again later or go back.</AlertDescription>
         <div className="mt-4">
            <Button onClick={handleGoBack} variant="outline">
                <ChevronLeft className="mr-2 h-4 w-4" /> Go Back
            </Button>
        </div>
      </Alert>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <Card className="shadow-xl border-t-4 border-primary">
        <CardHeader>
          <Button onClick={handleGoBack} variant="outline" size="sm" className="absolute top-4 left-4">
            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Path
          </Button>
          <CardTitle className="text-2xl md:text-3xl text-center pt-8">Quiz: {moduleTitle}</CardTitle>
          {!quizCompleted && (
            <CardDescription className="text-center text-base">
              Question {currentQuestionIndex + 1} of {questions.length}
            </CardDescription>
          )}
        </CardHeader>

        {!quizCompleted && currentQuestion ? (
          <>
            <CardContent className="space-y-6 px-6 py-8">
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-full h-3 mb-6" />
              <div className="p-6 rounded-lg border bg-background shadow-sm">
                <p className="font-semibold text-lg mb-4">{currentQuestion.questionText}</p>
                <RadioGroup
                  onValueChange={(value) => handleOptionSelect(parseInt(value))}
                  value={selectedOption?.toString()}
                  className="space-y-3"
                >
                  {currentQuestion.options.map((option, oIndex) => (
                    <div key={oIndex} className="flex items-center space-x-3 p-3 rounded-md border hover:bg-muted/50 transition-colors cursor-pointer has-[:checked]:bg-primary/10 has-[:checked]:border-primary">
                      <RadioGroupItem value={oIndex.toString()} id={`q${currentQuestionIndex}-o${oIndex}`} className="shrink-0" />
                      <Label htmlFor={`q${currentQuestionIndex}-o${oIndex}`} className="flex-grow cursor-pointer text-base">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end pt-6 px-6">
              <Button onClick={handleNextQuestion} size="lg">
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
              </Button>
            </CardFooter>
          </>
        ) : (
          // Quiz Completed - Review Mode
          <CardContent className="space-y-8 px-6 py-8">
            <div className="text-center p-6 bg-primary/10 rounded-lg w-full mb-8 shadow">
              <CheckCircle className="h-12 w-12 text-primary mx-auto mb-3" />
              <h3 className="text-2xl font-semibold mb-2">Quiz Complete!</h3>
              <p className="text-3xl font-bold text-primary mb-1">Your Score: {score.toFixed(0)}%</p>
              <p className="text-muted-foreground mb-4">
                {score >= 75 ? "Excellent work! You've demonstrated a strong understanding." : "Good effort! Review the material and try again to improve your score."}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                <Button onClick={handleRetakeQuiz} variant="outline">
                  <Sparkles className="mr-2 h-4 w-4" /> Retake Quiz
                </Button>
                <Button onClick={handleGoBack} >
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back to Learning Path
                </Button>
              </div>
            </div>

            <h4 className="text-xl font-semibold text-center text-foreground mb-4">Review Your Answers</h4>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className={`p-6 rounded-lg border ${userAnswers[qIndex] === q.correctAnswerIndex ? 'border-green-500 bg-green-500/10' : userAnswers[qIndex] !== undefined ? 'border-red-500 bg-red-500/10' : 'bg-card'}`}>
                <p className="font-semibold text-lg mb-1">Question {qIndex + 1}: {q.questionText}</p>
                <RadioGroup
                  value={userAnswers[qIndex]?.toString()}
                  disabled // Always disabled in review mode
                  className="space-y-2 mt-3"
                >
                  {q.options.map((option, oIndex) => (
                    <div key={oIndex} className={`flex items-center space-x-3 p-3 rounded-md border transition-colors 
                      ${oIndex === q.correctAnswerIndex ? 'border-green-600 bg-green-500/20 text-green-800 font-medium' 
                      : userAnswers[qIndex] === oIndex && oIndex !== q.correctAnswerIndex ? 'border-red-600 bg-red-500/20 text-red-800' 
                      : 'bg-background/50'}`}>
                      <RadioGroupItem value={oIndex.toString()} id={`review-q${qIndex}-o${oIndex}`} className="shrink-0" 
                        checked={userAnswers[qIndex] === oIndex} // Manually control checked for review
                      />
                      <Label htmlFor={`review-q${qIndex}-o${oIndex}`} className="flex-grow text-base">
                        {option}
                        {oIndex === q.correctAnswerIndex && <span className="ml-2 text-green-700 font-semibold">(Correct Answer)</span>}
                        {userAnswers[qIndex] === oIndex && oIndex !== q.correctAnswerIndex && <span className="ml-2 text-red-700 font-semibold">(Your Answer)</span>}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                {q.explanation && (
                  <div className="mt-4 pt-3 border-t border-border/50">
                     <p className="text-sm text-muted-foreground flex items-start">
                       <Info size={18} className="mr-2 mt-0.5 text-primary flex-shrink-0" /> 
                       <span><span className="font-semibold text-foreground">Explanation:</span> {q.explanation}</span>
                    </p>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        )}
      </Card>
    </div>
  );
}


export default function QuizPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <Spinner className="h-10 w-10 text-primary" />
      </div>
    }>
      <QuizPageContent />
    </Suspense>
  );
}

    