import { useState, useEffect, useCallback } from 'react';
import { BookOpen, ArrowLeft, ArrowRight, CheckCircle2, XCircle, Award, Trophy, GraduationCap, Lightbulb, RotateCcw, Lock, Play, Gamepad2 } from 'lucide-react';
import { DashboardLayout } from '@/components/DashboardLayout';
import { StatCard, PageHeader } from '@/components/ui/StatCard';
import { Spinner, EmptyState } from '@/components/ui/Spinner';
import { useAuth } from '@/context/AuthContext';
import { supabase, type LearningModule, type QuizQuestion, type QuizAttempt, type Certificate } from '@/lib/supabase';

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/app', icon: <BookOpen className="h-4.5 w-4.5" /> },
  { label: 'AI Scanner', path: '/app/scan', icon: <Play className="h-4.5 w-4.5" /> },
  { label: 'Learning Hub', path: '/app/learning', icon: <GraduationCap className="h-4.5 w-4.5" /> },
];

export function LearningHub() {
  const { profile } = useAuth();
  const ageGroup: 'kids' | 'teens' = profile?.age != null && profile.age <= 13 ? 'kids' : 'teens';
  const [modules, setModules] = useState<LearningModule[]>([]);
  const [attempts, setAttempts] = useState<QuizAttempt[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeModule, setActiveModule] = useState<LearningModule | null>(null);
  const [activeView, setActiveView] = useState<'list' | 'lesson' | 'quiz' | 'result'>('list');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [lastScore, setLastScore] = useState<{ score: number; total: number; passed: boolean } | null>(null);
  const [gameOpen, setGameOpen] = useState(false);
  const [activeGame, setActiveGame] = useState<string>('sort-it-out');
  const [activeModuleUrl, setActiveModuleUrl] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!profile) return;
    const [modRes, attRes, certRes] = await Promise.all([
      supabase.from('learning_modules').select('*').eq('age_group', ageGroup).order('order_index', { ascending: true }),
      supabase.from('quiz_attempts').select('*').eq('user_id', profile.id).order('created_at', { ascending: false }),
      supabase.from('certificates').select('*').eq('user_id', profile.id).order('issued_at', { ascending: false }),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setModules((modRes.data as LearningModule[]) ?? []);
    setAttempts((attRes.data as QuizAttempt[]) ?? []);
    setCertificates((certRes.data as Certificate[]) ?? []);
    setLoading(false);
  }, [profile, ageGroup]);

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    async function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'close-game') {
        setGameOpen(false);
        setActiveModuleUrl(null);
      }
      if (e.data?.type === 'quiz-complete' && activeModule && profile) {
        const { score, total, passed } = e.data;
        await supabase.from('quiz_attempts').insert({
          user_id: profile.id,
          module_id: activeModule.id,
          score,
          total_questions: total,
          passed,
          answers: [],
        });

        if (passed) {
          const moduleIndex = modules.findIndex(m => m.id === activeModule.id);
          if (moduleIndex === modules.length - 1) {
            const certNumber = `ESC-${Date.now()}`;
            await supabase.from('certificates').insert({
              user_id: profile.id,
              certificate_type: 'course_completion',
              module_id: activeModule.id,
              certificate_number: certNumber,
            });
          }
        }
        loadData();
      }
    }
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [activeModule, modules, profile, loadData]);

  function isModuleCompleted(moduleId: string): boolean {
    return attempts.some(a => a.module_id === moduleId && a.passed);
  }

  function isModuleUnlocked(index: number): boolean {
    if (index === 0) return true;
    return isModuleCompleted(modules[index - 1].id);
  }

  async function startQuiz(module: LearningModule) {
    const { data } = await supabase.from('quiz_questions').select('*').eq('module_id', module.id);
    setQuizQuestions((data as QuizQuestion[]) ?? []);
    setCurrentQ(0);
    setAnswers([]);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setActiveModule(module);
    setActiveView('quiz');
  }

  async function submitAnswer() {
    if (selectedAnswer === null || !activeModule) return;
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setShowExplanation(true);
  }

  async function nextQuestion() {
    if (currentQ + 1 < quizQuestions.length) {
      setCurrentQ(currentQ + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      const finalAnswers = answers;
      let score = 0;
      quizQuestions.forEach((q, i) => {
        if (finalAnswers[i] === q.correct_index) score++;
      });
      const total = quizQuestions.length;
      const passed = score >= Math.ceil(total * 0.7);

      if (profile) {
        await supabase.from('quiz_attempts').insert({
          user_id: profile.id,
          module_id: activeModule!.id,
          score,
          total_questions: total,
          passed,
          answers: finalAnswers,
        });

        if (passed) {
          const moduleIndex = modules.findIndex(m => m.id === activeModule!.id);
          if (moduleIndex === modules.length - 1) {
            const certNumber = `ESC-${Date.now()}`;
            await supabase.from('certificates').insert({
              user_id: profile.id,
              certificate_type: 'course_completion',
              module_id: activeModule!.id,
              certificate_number: certNumber,
            });
          }
        }
      }

      setLastScore({ score, total, passed });
      setActiveView('result');
    }
  }

  function resetQuiz() {
    setActiveView('list');
    setActiveModule(null);
    setLastScore(null);
    loadData();
  }

  if (!profile) return <Spinner label="Loading..." />;

  // ===== Standalone Textbook HTML Page View =====
  if (activeModuleUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-[#e8f4f8]">
        <iframe
          src={activeModuleUrl}
          title={activeModule?.title || 'Learning Module'}
          className="h-full w-full"
          style={{ border: 'none' }}
        />
      </div>
    );
  }

  // ===== Lesson View =====
  if (activeView === 'lesson' && activeModule) {
    return (
      <LessonView
        module={activeModule}
        onBack={() => { setActiveView('list'); setActiveModule(null); }}
        onStartQuiz={() => startQuiz(activeModule)}
      />
    );
  }

  // ===== Quiz View =====
  if (activeView === 'quiz' && activeModule) {
    const question = quizQuestions[currentQ];
    if (!question) {
      return (
        <DashboardLayout>
          <EmptyState icon={<BookOpen className="h-10 w-10" />} title="No quiz questions for this module" />
        </DashboardLayout>
      );
    }

    return (
      <DashboardLayout>
        <div className="mx-auto max-w-2xl">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-slate-500">Question {currentQ + 1} of {quizQuestions.length}</p>
            <p className="text-sm font-medium text-slate-500">{activeModule.title}</p>
          </div>

          <div className="mb-6 h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-emerald-500 transition-all" style={{ width: `${((currentQ + 1) / quizQuestions.length) * 100}%` }} />
          </div>

          <div className="card p-8 animate-slide-up">
            <h2 className="text-lg font-bold text-slate-900">{question.question}</h2>
            <div className="mt-6 space-y-3">
              {question.options.map((opt, i) => {
                const isSelected = selectedAnswer === i;
                const isCorrect = i === question.correct_index;
                let style = 'border-slate-200 hover:border-slate-300 hover:bg-slate-50';
                if (showExplanation) {
                  if (isCorrect) style = 'border-green-500 bg-green-50';
                  else if (isSelected) style = 'border-red-500 bg-red-50';
                  else style = 'border-slate-200 opacity-60';
                } else if (isSelected) {
                  style = 'border-emerald-500 bg-emerald-50';
                }
                return (
                  <button
                    key={i}
                    disabled={showExplanation}
                    onClick={() => setSelectedAnswer(i)}
                    className={`flex w-full items-center gap-3 rounded-xl border-2 p-4 text-left text-sm font-medium transition-all ${style}`}
                  >
                    <div className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                      showExplanation && isCorrect ? 'bg-green-500 text-white' :
                      showExplanation && isSelected && !isCorrect ? 'bg-red-500 text-white' :
                      isSelected ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {showExplanation && isCorrect ? <CheckCircle2 className="h-4 w-4" /> :
                       showExplanation && isSelected && !isCorrect ? <XCircle className="h-4 w-4" /> :
                       String.fromCharCode(65 + i)}
                    </div>
                    {opt}
                  </button>
                );
              })}
            </div>

            {showExplanation && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-blue-50 p-4 text-sm text-blue-800">
                <Lightbulb className="h-4 w-4 shrink-0 mt-0.5" />
                <p>{question.explanation}</p>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              {!showExplanation ? (
                <button onClick={submitAnswer} disabled={selectedAnswer === null} className="btn-primary">
                  Submit Answer
                </button>
              ) : (
                <button onClick={nextQuestion} className="btn-primary">
                  {currentQ + 1 < quizQuestions.length ? 'Next Question' : 'Finish Quiz'} <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ===== Result View =====
  if (activeView === 'result' && lastScore) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-lg">
          <div className="card p-8 text-center animate-scale-in">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${lastScore.passed ? 'bg-green-100' : 'bg-amber-100'}`}>
              {lastScore.passed ? <Trophy className="h-8 w-8 text-green-600" /> : <RotateCcw className="h-8 w-8 text-amber-600" />}
            </div>
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              {lastScore.passed ? 'Congratulations!' : 'Keep Learning!'}
            </h2>
            <p className="mt-2 text-slate-500">
              You scored {lastScore.score} out of {lastScore.total} ({Math.round((lastScore.score / lastScore.total) * 100)}%)
            </p>
            {lastScore.passed ? (
              <p className="mt-2 text-sm text-green-600">You passed this module!</p>
            ) : (
              <p className="mt-2 text-sm text-amber-600">You need 70% to pass. Try again!</p>
            )}
            <button onClick={resetQuiz} className="btn-primary mt-6">
              {lastScore.passed ? 'Back to Modules' : 'Try Again'} <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // ===== Kids Game View (ages 5-13) =====
  const GAMES = [
    {
      id: 'sort-it-out',
      title: 'Identify Waste',
      src: '/sort-game.html',
      img: 'https://images.pexels.com/photos/39636697/pexels-photo-39636697.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      desc: 'Flip cards to learn which bin each item belongs in, then take a timed quiz and match items to bins.',
      modes: '3 modes · 22 items',
    },
    {
      id: 'drop-it-in',
      title: 'Assign Waste in Bins',
      src: '/drop-it-in.html',
      img: 'https://images.pexels.com/photos/17527977/pexels-photo-17527977.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      desc: 'Drag and drop waste items into the correct bin. New bin pairs unlock as you clear each level!',
      modes: '4 levels · 16 items',
    },
    {
      id: 'match-the-bin',
      title: 'Bin Match Game',
      src: '/match-the-bin.html',
      img: 'https://images.pexels.com/photos/10840656/pexels-photo-10840656.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      desc: 'Tap an item, then tap the bin it belongs to. Clear all rounds to win the game!',
      modes: '7 rounds · 21 items',
    },
    {
      id: 'recycle-factory',
      title: 'Recycle Factory',
      src: '/recycle-factory.html',
      img: 'https://images.pexels.com/photos/39839876/pexels-photo-39839876.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      desc: 'Run the conveyor belt! Send each dry-waste item to the right machine and watch what it becomes.',
      modes: '5 machines · 7 items',
    },
    {
      id: 'upcycle-picker',
      title: 'Upcycle Picker',
      src: '/upcycle-picker.html',
      img: 'https://images.pexels.com/photos/29512755/pexels-photo-29512755.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
      desc: 'One item, many new lives! Pick every real product each dry-waste item can be turned into.',
      modes: '7 items · multi-pick',
    },
  ];

  const isGamesView = ageGroup === 'kids' || window.location.search.includes('view=games');

  if (isGamesView) {
    if (gameOpen) {
      const game = GAMES.find(g => g.id === activeGame) ?? GAMES[0];
      return (
        <div className="fixed inset-0 z-50 bg-white">
          <iframe
            src={game.src}
            title={game.title}
            className="h-full w-full"
            style={{ border: 'none' }}
          />
        </div>
      );
    }

    return (
      <DashboardLayout>
        <PageHeader
          title="Learning Hub"
          subtitle="Play games and learn how to sort waste the right way!"
        />
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
          <GraduationCap className="h-4 w-4" />
          Game-based learning for ages 5-13. Tap a game to start playing!
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {GAMES.map((game) => (
            <button
              key={game.id}
              onClick={() => { setActiveGame(game.id); setGameOpen(true); }}
              className="group overflow-hidden rounded-2xl border border-slate-200 bg-white text-left shadow-sm transition-all hover:shadow-lg hover:border-emerald-300"
            >
              <div className="relative aspect-[16/10] overflow-hidden">
                <img
                  src={game.img}
                  alt={game.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-3 left-4 flex items-center gap-2">
                  <span className="badge bg-emerald-500 text-white border-emerald-600">Beginner</span>
                  <span className="badge bg-white/90 text-slate-700 border-white">Game</span>
                </div>
              </div>
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <Gamepad2 className="h-5 w-5 text-emerald-600" />
                  <h3 className="text-lg font-bold text-slate-900">{game.title}</h3>
                </div>
                <p className="mt-1.5 text-sm text-slate-500">
                  {game.desc}
                </p>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-400">{game.modes}</span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600 group-hover:text-emerald-700">
                    Play Now <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </DashboardLayout>
    );
  }

  // ===== Module List View =====
  const completedCount = modules.filter(m => isModuleCompleted(m.id)).length;

  return (
    <DashboardLayout>
      <PageHeader
        title="Learning Hub"
        subtitle="Learn about waste management through interactive lessons and quizzes."
      />

      {/* Age group banner */}
      <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
        {(ageGroup as string) === 'kids' ? <GraduationCap className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
        {(ageGroup as string) === 'kids'
          ? 'Game-based learning for ages 5-13. Learn through fun games!'
          : 'Lesson-based learning for ages 14+. Lessons, videos, quizzes & certificates.'}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <StatCard icon={BookOpen} label="Modules Available" value={modules.length} color="blue" />
        <StatCard icon={CheckCircle2} label="Modules Completed" value={completedCount} color="green" />
        <StatCard icon={Award} label="Certificates Earned" value={certificates.length} color="amber" />
      </div>

      {/* Certificates */}
      {certificates.length > 0 && (
        <div className="mt-6">
          <h2 className="section-title mb-3">Your Certificates</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {certificates.map((cert) => (
              <div key={cert.id} className="card-hover flex items-center gap-3 p-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                  <Award className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">Certificate of Completion</p>
                  <p className="text-xs text-slate-500">{new Date(cert.issued_at).toLocaleDateString()} · #{cert.certificate_number}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modules */}
      <div className="mt-8">
        <h2 className="section-title mb-3">Learning Modules</h2>
        {loading ? (
          <Spinner label="Loading modules..." />
        ) : modules.length === 0 ? (
          <EmptyState icon={<BookOpen className="h-10 w-10" />} title="No modules available" message="Check back soon for learning content." />
        ) : (
          <div className="space-y-3">
            {modules.map((module, idx) => {
              const completed = isModuleCompleted(module.id);
              const unlocked = isModuleUnlocked(idx);
              return (
                <div key={module.id} className={`card p-5 ${!unlocked ? 'opacity-60' : 'card-hover'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                        completed ? 'bg-green-50 text-green-600' : unlocked ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                      }`}>
                        {completed ? <CheckCircle2 className="h-5 w-5" /> : unlocked ? <Play className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{module.title}</p>
                        <p className="text-xs text-slate-500">{module.description}</p>
                        <div className="mt-1 flex items-center gap-2">
                          <span className="badge bg-slate-100 text-slate-500 border-slate-200 capitalize">{module.level}</span>
                          {completed && <span className="badge bg-green-100 text-green-700 border-green-200">Completed</span>}
                        </div>
                      </div>
                    </div>
                    {unlocked && !completed && (
                      <button
                        onClick={() => {
                          setActiveModule(module);
                          setActiveModuleUrl(getModuleHtmlUrl(module));
                        }}
                        className="btn-primary text-sm flex items-center gap-1.5"
                      >
                        <BookOpen className="h-4 w-4" /> Start Reading
                      </button>
                    )}
                    {completed && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setActiveModule(module);
                            setActiveModuleUrl(getModuleHtmlUrl(module));
                          }}
                          className="btn-secondary text-sm flex items-center gap-1.5"
                        >
                          <BookOpen className="h-4 w-4" /> Re-read
                        </button>
                        <button
                          onClick={() => startQuiz(module)}
                          className="btn-secondary text-sm"
                        >
                          <RotateCcw className="h-4 w-4" /> Quiz
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ===== Module Standalone HTML Textbook Mapper =====
function getModuleHtmlUrl(module: LearningModule): string {
  const t = module.title.toLowerCase();
  if (t.includes('detective') || module.order_index === 1) return '/modules/module-1-waste-detective.html';
  if (t.includes('recycling') || module.order_index === 2) return '/modules/module-2-recycling-hero.html';
  if (t.includes('compost') || module.order_index === 3) return '/modules/module-3-compost-champion.html';
  if (t.includes('safety') || module.order_index === 4) return '/modules/module-4-safety-star.html';
  if (t.includes('3r') || module.order_index === 5) return '/modules/module-5-3r-master.html';
  if (t.includes('journey') || module.order_index === 6) return '/modules/module-6-waste-journey.html';
  return '/modules/module-1-waste-detective.html';
}

// ===== Module Theme & Video Helpers =====
function getModuleTheme(title: string) {
  const t = title.toLowerCase();
  if (t.includes('journey')) {
    return {
      accentHex: '#7c3aed',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      lightBg: 'bg-purple-50',
      tagText: 'text-purple-700',
    };
  }
  if (t.includes('3r') || t.includes('master')) {
    return {
      accentHex: '#ea580c',
      badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
      lightBg: 'bg-orange-50',
      tagText: 'text-orange-700',
    };
  }
  if (t.includes('safety')) {
    return {
      accentHex: '#ca8a04',
      badgeBg: 'bg-amber-100 text-amber-900 border-amber-300',
      lightBg: 'bg-amber-50',
      tagText: 'text-amber-800',
    };
  }
  if (t.includes('compost')) {
    return {
      accentHex: '#16a34a',
      badgeBg: 'bg-green-100 text-green-800 border-green-200',
      lightBg: 'bg-green-50',
      tagText: 'text-green-700',
    };
  }
  if (t.includes('recycl')) {
    return {
      accentHex: '#2563eb',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      lightBg: 'bg-blue-50',
      tagText: 'text-blue-700',
    };
  }
  if (t.includes('detective') || t.includes('waste')) {
    return {
      accentHex: '#0d9488',
      badgeBg: 'bg-teal-100 text-teal-800 border-teal-200',
      lightBg: 'bg-teal-50',
      tagText: 'text-teal-700',
    };
  }
  return {
    accentHex: '#059669',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    lightBg: 'bg-emerald-50',
    tagText: 'text-emerald-700',
  };
}

function getModuleVideoUrl(title: string, customVideoUrl?: string): string {
  if (customVideoUrl && customVideoUrl.trim().length > 0) {
    if (customVideoUrl.includes('youtube.com/embed/')) return customVideoUrl;
    const match = customVideoUrl.match(/(?:youtu\.be\/|watch\?v=)([\w-]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return customVideoUrl;
  }
  const t = title.toLowerCase();
  if (t.includes('journey')) {
    return 'https://www.youtube.com/embed/40OKRIyOrYI';
  }
  if (t.includes('3r') || t.includes('master')) {
    return 'https://www.youtube.com/embed/zVBkjMbF4Z4';
  }
  if (t.includes('safety')) {
    return 'https://www.youtube.com/embed/7cublLZ0BH0';
  }
  if (t.includes('compost')) {
    return 'https://www.youtube.com/embed/26IO95Xt5WU';
  }
  if (t.includes('recycl')) {
    return 'https://www.youtube.com/embed/OasbYWF4_S8';
  }
  if (t.includes('detective') || t.includes('waste')) {
    return 'https://www.youtube.com/embed/7cublLZ0BH0';
  }
  return 'https://www.youtube.com/embed/7cublLZ0BH0';
}

// ===== Lesson View Component (Book-Style Digital Textbook) =====
function LessonView({ module, onBack, onStartQuiz }: { module: LearningModule; onBack: () => void; onStartQuiz: () => void }) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const theme = getModuleTheme(module.title);
  const videoUrl = getModuleVideoUrl(module.title, module.video_url);
  const sections = module.content.slides ?? module.content.sections ?? [];
  const teacherNote =
    (module.content as any)?.teacher_note ||
    (module.content as any)?.parent_note ||
    (module.content as any)?.note ||
    (module as any)?.teacher_note;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });

    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setScrollProgress(progress);
      } else {
        setScrollProgress(100);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <DashboardLayout>
      {/* Sticky Reading Progress Bar */}
      <div className="sticky top-16 lg:top-0 z-30 -mt-4 sm:-mt-6 lg:-mt-8 -mx-4 sm:-mx-6 lg:-mx-8 mb-6 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-md shadow-xs transition-all sm:px-6 lg:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 text-xs font-semibold text-slate-600 mb-1.5">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to modules</span>
          </button>
          <span className="truncate text-slate-700 font-medium hidden sm:inline">
            {module.title}
          </span>
          <span className="shrink-0 font-bold" style={{ color: theme.accentHex }}>
            {Math.round(scrollProgress)}% read
          </span>
        </div>
        <div className="mx-auto max-w-3xl h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full transition-all duration-150"
            style={{
              width: `${scrollProgress}%`,
              backgroundColor: theme.accentHex,
            }}
          />
        </div>
      </div>

      {/* Book-Style Chapter Container */}
      <div className="mx-auto max-w-3xl animate-fade-in pb-12">
        <article className="rounded-3xl border border-slate-200/80 bg-white p-6 sm:p-10 shadow-sm">
          {/* Top of Page: Header & Video */}
          <header className="mb-10">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span
                className="badge capitalize font-semibold"
                style={{
                  backgroundColor: `${theme.accentHex}15`,
                  color: theme.accentHex,
                  borderColor: `${theme.accentHex}30`,
                }}
              >
                {module.level} Level
              </span>
              <span className="badge bg-slate-100 text-slate-600 border-slate-200">
                Teen Textbook Chapter
              </span>
              {sections.length > 0 && (
                <span className="badge bg-slate-100 text-slate-600 border-slate-200">
                  {sections.length} Sections
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 leading-tight">
              {module.title}
            </h1>

            <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed">
              {module.description}
            </p>

            {/* Video Lesson Embed */}
            <div className="mt-6">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-md">
                <iframe
                  src={videoUrl}
                  title={`${module.title} Video Guide`}
                  className="absolute inset-0 h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              </div>
              <p className="mt-2 text-center text-xs text-slate-400">
                📺 Watch the short video guide above before reading through the chapter below.
              </p>
            </div>
          </header>

          <hr className="mb-10 border-slate-200" />

          {/* Book Sections Flow */}
          <div className="space-y-10">
            {sections.map((section, idx) => {
              const sectionTitle = 'title' in section ? section.title : section.heading;
              return (
                <div key={idx}>
                  <section
                    className="relative pl-5 sm:pl-7 border-l-4 py-1"
                    style={{ borderLeftColor: theme.accentHex }}
                  >
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider"
                        style={{
                          backgroundColor: `${theme.accentHex}15`,
                          color: theme.accentHex,
                        }}
                      >
                        Section {idx + 1}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-3.5 leading-snug">
                      {sectionTitle}
                    </h2>

                    <div className="space-y-3.5 text-base sm:text-lg text-slate-700 leading-relaxed">
                      {section.body.split('\n\n').map((paragraph, pIdx) => (
                        <p key={pIdx}>{paragraph}</p>
                      ))}
                    </div>

                    {section.game && (
                      <GameEmbed src={section.game} accentColor={theme.accentHex} />
                    )}
                  </section>

                  {idx < sections.length - 1 && (
                    <hr className="mt-10 border-slate-200/80" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Teacher / Parent Note if available */}
          {teacherNote && (
            <div className="mt-12 rounded-2xl border border-amber-200 bg-amber-50/90 p-5 sm:p-6 text-amber-900 shadow-sm">
              <div className="flex items-center gap-2 font-bold text-amber-900 mb-2">
                <Lightbulb className="h-5 w-5 text-amber-600 shrink-0" />
                <span className="text-base">Teacher & Parent Note</span>
              </div>
              <p className="text-sm sm:text-base leading-relaxed text-amber-800">
                {teacherNote}
              </p>
            </div>
          )}

          {/* Bottom Call to Action: Take the Quiz */}
          <div className="mt-12 rounded-2xl border border-slate-200/90 bg-slate-50/80 p-6 sm:p-8 text-center">
            <div
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-sm mb-4"
              style={{ backgroundColor: theme.accentHex }}
            >
              <GraduationCap className="h-7 w-7" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
              Chapter Complete! Ready for the Quiz?
            </h3>
            <p className="text-sm sm:text-base text-slate-600 max-w-md mx-auto mb-6">
              Test what you've learned in {module.title} to score points and unlock your certificate.
            </p>
            <button
              onClick={onStartQuiz}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-2xl px-8 py-4 text-base font-bold text-white shadow-md transition-all hover:shadow-lg hover:brightness-110 active:scale-[0.99]"
              style={{ backgroundColor: theme.accentHex }}
            >
              <Trophy className="h-5 w-5" />
              Take the Quiz
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </article>
      </div>
    </DashboardLayout>
  );
}

// ===== Game Embed Component =====
function GameEmbed({ src, accentColor = '#059669' }: { src: string; accentColor?: string }) {
  const [open, setOpen] = useState(false);

  if (open) {
    return (
      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md">
        <div className="flex items-center justify-between bg-slate-800 px-4 py-2.5 text-white">
          <div className="flex items-center gap-2">
            <Gamepad2 className="h-4 w-4 text-emerald-400" />
            <span className="text-xs font-semibold tracking-wide">Interactive Mini Game</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="rounded px-2 py-0.5 text-xs font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
          >
            ✕ Close
          </button>
        </div>
        <iframe
          src={src}
          title="Mini Game"
          className="w-full"
          style={{ height: '480px', border: 'none' }}
          allow="autoplay"
        />
      </div>
    );
  }

  return (
    <button
      onClick={() => setOpen(true)}
      className="group mt-5 flex w-full items-center gap-4 rounded-2xl border-2 border-dashed p-4 sm:p-5 text-left transition-all hover:shadow-sm"
      style={{
        borderColor: `${accentColor}60`,
        backgroundColor: `${accentColor}0a`,
      }}
    >
      <div
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-white shadow-sm transition-transform group-hover:scale-105"
        style={{ backgroundColor: accentColor }}
      >
        <Gamepad2 className="h-6 w-6" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-slate-900">Interactive Mini Game</p>
          <span
            className="rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            Play & Learn
          </span>
        </div>
        <p className="mt-0.5 text-xs sm:text-sm text-slate-600">
          Reinforce this section with a quick hands-on activity. Tap to play!
        </p>
      </div>
      <span
        className="inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-xs sm:text-sm font-bold text-white shadow-sm transition-all group-hover:brightness-110"
        style={{ backgroundColor: accentColor }}
      >
        <Play className="h-3.5 w-3.5 fill-current" /> Play Now
      </span>
    </button>
  );
}
