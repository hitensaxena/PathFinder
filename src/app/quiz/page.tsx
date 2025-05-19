
"use client";

import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { generateQuiz, type GenerateQuizInput, type QuizQuestion } from '@/ai/flows/generate-quiz-flow';
import { updateLearningPathModuleQuizStatus } from '@/services/learningPathService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Spinner } from '@/components/spinner';
import { AlertCircle, CheckCircle, ChevronLeft, Home, Info, Sparkles, RefreshCw, Target, BookOpen, ChevronRight } from 'lucide-react'; // Added ChevronRight
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';


type UserAnswers = { [questionIndex: number]: number };
const QUIZ_COMPLETION_THRESHOLD = 75; // 75%

function QuizPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();

  const moduleTitle = searchParams.get('moduleTitle');
  const moduleDescription = searchParams.get('moduleDescription');
  const learningGoal = searchParams.get('learningGoal');
  const pathId = searchParams.get('pathId');
  const moduleIndexStr = searchParams.get('moduleIndex');
  const moduleIndex = moduleIndexStr ? parseInt(moduleIndexStr) : undefined;


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
    setQuestions([]); 
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
  }, [moduleTitle, moduleDescription, learningGoal, toast]); 

  useEffect(() => {
    fetchQuiz();
  }, [fetchQuiz]);


  const handleOptionSelect = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNextQuestion = async () => {
    if (selectedOption === undefined) {
        toast({ title: "No option selected", description: "Please select an answer before proceeding.", variant: "destructive"});
        return;
    }

    const newAnswers = { ...userAnswers, [currentQuestionIndex]: selectedOption };
    setUserAnswers(newAnswers);
    setSelectedOption(undefined); 

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      let correctAnswers = 0;
      questions.forEach((q, index) => {
        if (newAnswers[index] === q.correctAnswerIndex) {
          correctAnswers++;
        }
      });
      const finalScore = (correctAnswers / questions.length) * 100;
      setScore(finalScore);
      setQuizCompleted(true);
      
      const isModuleCompleted = finalScore >= QUIZ_COMPLETION_THRESHOLD;

      toast({
        title: "Quiz Submitted!",
        description: `You scored ${finalScore.toFixed(0)}%. ${isModuleCompleted ? "Module completed!" : "Try again to improve your score."}`,
        variant: isModuleCompleted ? "default" : "destructive",
        duration: isModuleCompleted ? 5000 : 7000
      });

      if (pathId && moduleIndex !== undefined) {
        try {
          await updateLearningPathModuleQuizStatus(pathId, moduleIndex, finalScore, isModuleCompleted);
          toast({
            title: "Progress Saved",
            description: "Your quiz score and completion status have been saved.",
          });
        } catch (saveError) {
          console.error("Error saving quiz status:", saveError);
          toast({
            title: "Save Error",
            description: "Could not save your quiz score. Please try again later.",
            variant: "destructive",
          });
        }
      }
    }
  };


  const handleGoBack = () => {
    if (pathId) {
        router.push('/saved-paths');
    } else if (window.history.length > 2) { 
      router.back();
    } else {
      router.push('/');
    }
  };
  
  const handleRetakeQuiz = () => {
    fetchQuiz(); 
  };


  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)]">
        <Card className="p-8 shadow-xl rounded-xl bg-card">
          <Spinner className="h-16 w-16 text-primary mb-4" />
          <p className="mt-4 text-xl text-muted-foreground">Generating your quiz questions...</p>
          <p className="text-sm text-muted-foreground">Hold tight, this will be quick!</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-2xl">
        <Alert variant="destructive" className="shadow-lg rounded-xl p-6">
          <AlertCircle className="h-6 w-6" />
          <AlertTitle className="text-xl">Error Loading Quiz</AlertTitle>
          <AlertDescription className="text-base mt-1">{error}</AlertDescription>
          <div className="mt-6">
              <Button onClick={handleGoBack} variant="outline" className="rounded-lg">
                  <ChevronLeft className="mr-2 h-5 w-5" /> Go Back
              </Button>
          </div>
        </Alert>
      </div>
    );
  }

  if (questions.length === 0 && !isLoading) {
    return (
      <div className="container mx-auto py-10 px-4 max-w-2xl">
        <Alert className="shadow-lg rounded-xl p-6 border-primary/30 bg-card">
          <Info className="h-6 w-6 text-primary" />
          <AlertTitle className="text-xl">No Questions Available</AlertTitle>
          <AlertDescription className="text-base mt-1">The AI couldn't generate questions for this module, or no questions were found. Please try again later or go back.</AlertDescription>
           <div className="mt-6">
              <Button onClick={handleGoBack} variant="outline" className="rounded-lg">
                  <ChevronLeft className="mr-2 h-5 w-5" /> Go Back
              </Button>
          </div>
        </Alert>
      </div>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <Card className="shadow-2xl border-t-4 border-primary rounded-xl overflow-hidden bg-card">
        <CardHeader className="bg-muted/50 p-6 border-b border-border">
          <div className="flex justify-between items-center">
            <Button onClick={handleGoBack} variant="outline" size="sm" className="rounded-md">
              <ChevronLeft className="mr-1 h-4 w-4" /> Back
            </Button>
            {!quizCompleted && (
              <div className="text-right">
                <p className="text-sm font-medium text-primary">Question {currentQuestionIndex + 1} of {questions.length}</p>
                <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="w-32 h-2.5 mt-1" />
              </div>
            )}
          </div>
          <CardTitle className="text-3xl md:text-4xl font-bold text-foreground text-center pt-4 leading-tight">{moduleTitle}</CardTitle>
          <CardDescription className="text-center text-lg text-muted-foreground">Test Your Knowledge</CardDescription>
        </CardHeader>

        {!quizCompleted && currentQuestion ? (
          <>
            <CardContent className="space-y-8 px-6 py-10">
              <div className="p-6 rounded-xl border-2 border-primary/20 bg-background shadow-lg">
                <p className="font-semibold text-xl md:text-2xl mb-6 text-foreground">{currentQuestion.questionText}</p>
                <RadioGroup
                  onValueChange={(value) => handleOptionSelect(parseInt(value))}
                  value={selectedOption?.toString()}
                  className="space-y-4"
                >
                  {currentQuestion.options.map((option, oIndex) => (
                    <Label 
                      key={oIndex} 
                      htmlFor={`q${currentQuestionIndex}-o${oIndex}`}
                      className={`flex items-center space-x-3 p-4 rounded-lg border-2  hover:border-primary transition-all duration-200 cursor-pointer
                                  ${selectedOption === oIndex ? 'border-primary bg-primary/10 ring-2 ring-primary ring-offset-2' : 'border-border bg-card hover:bg-muted/50'}`}
                    >
                      <RadioGroupItem value={oIndex.toString()} id={`q${currentQuestionIndex}-o${oIndex}`} className="shrink-0 h-5 w-5" />
                      <span className="flex-grow text-lg text-foreground">{option}</span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end p-6 bg-muted/30 border-t border-border">
              <Button onClick={handleNextQuestion} size="lg" className="rounded-lg px-8 py-6 text-base">
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Submit Quiz'}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </CardFooter>
          </>
        ) : (
          <CardContent className="space-y-10 px-6 py-10">
            <div className={`text-center p-8 rounded-xl shadow-xl border-2 ${score >= QUIZ_COMPLETION_THRESHOLD ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
              {score >= QUIZ_COMPLETION_THRESHOLD ? 
                <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" /> :
                <AlertCircle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              }
              <h3 className="text-3xl font-bold mb-2 text-foreground">{score >= QUIZ_COMPLETION_THRESHOLD ? 'Quiz Passed!' : 'Needs Improvement!'}</h3>
              <p className={`text-5xl font-extrabold mb-2 ${score >= QUIZ_COMPLETION_THRESHOLD ? 'text-green-700' : 'text-red-700'}`}>{score.toFixed(0)}%</p>
              <p className="text-lg text-muted-foreground mb-6">
                {score >= QUIZ_COMPLETION_THRESHOLD ? "Fantastic work! You've successfully completed this module." : "Good effort! Review the material and try again to master this module."}
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button onClick={handleRetakeQuiz} variant="outline" size="lg" className="rounded-lg border-primary text-primary hover:bg-primary/10">
                  <RefreshCw className="mr-2 h-5 w-5" /> Retake Quiz
                </Button>
                <Button onClick={handleGoBack} size="lg" className="rounded-lg">
                  <BookOpen className="mr-2 h-5 w-5" /> Back to Learning Path
                </Button>
              </div>
            </div>

            <h4 className="text-2xl font-semibold text-center text-foreground mb-6 border-b pb-3">Review Your Answers</h4>
            {questions.map((q, qIndex) => (
              <div key={qIndex} className={`p-6 rounded-xl border-2 shadow-md ${userAnswers[qIndex] === q.correctAnswerIndex ? 'border-green-500/30 bg-green-500/5' : userAnswers[qIndex] !== undefined ? 'border-red-500/30 bg-red-500/5' : 'border-border bg-card'}`}>
                <p className="font-semibold text-xl mb-2 text-foreground">Question {qIndex + 1}: {q.questionText}</p>
                <RadioGroup
                  value={userAnswers[qIndex]?.toString()}
                  disabled 
                  className="space-y-3 mt-4"
                >
                  {q.options.map((option, oIndex) => (
                    <Label key={oIndex} htmlFor={`review-q${qIndex}-o${oIndex}`} 
                           className={`flex items-center space-x-3 p-3 rounded-md border transition-colors 
                      ${oIndex === q.correctAnswerIndex ? 'border-green-600 bg-green-500/10 text-green-800 font-medium' 
                      : userAnswers[qIndex] === oIndex && oIndex !== q.correctAnswerIndex ? 'border-red-600 bg-red-500/10 text-red-800 font-medium' 
                      : 'border-border bg-background/50 text-muted-foreground'}`}>
                      <RadioGroupItem value={oIndex.toString()} id={`review-q${qIndex}-o${oIndex}`} className="shrink-0 h-5 w-5" 
                        checked={userAnswers[qIndex] === oIndex} 
                      />
                      <span className="flex-grow text-base">
                        {option}
                        {oIndex === q.correctAnswerIndex && <span className="ml-2 text-xs py-0.5 px-1.5 rounded bg-green-600 text-white font-semibold">(Correct)</span>}
                        {userAnswers[qIndex] === oIndex && oIndex !== q.correctAnswerIndex && <span className="ml-2 text-xs py-0.5 px-1.5 rounded bg-red-600 text-white font-semibold">(Your Answer)</span>}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
                {q.explanation && (
                  <div className="mt-5 pt-4 border-t border-border/50">
                     <p className="text-md text-muted-foreground flex items-start">
                       <Info size={20} className="mr-2.5 mt-0.5 text-primary flex-shrink-0" /> 
                       <span><strong className="font-semibold text-foreground">Explanation:</strong> {q.explanation}</span>
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
        <Spinner className="h-12 w-12 text-primary" />
         <p className="ml-4 text-xl text-muted-foreground">Loading Quiz...</p>
      </div>
    }>
      <QuizPageContent />
    </Suspense>
  );
}

