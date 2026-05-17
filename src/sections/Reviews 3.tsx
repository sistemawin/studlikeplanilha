import { CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import type { NavTarget, Review, Subject, Topic } from "@/types";

type Props = {
  reviews: Review[];
  topics: Record<string, Topic>;
  subjects: Record<string, Subject>;
  todayIso: string;
  activeSection: NavTarget;
  onComplete: (reviewId: string) => void;
};

function daysOverdue(reviewDate: string, todayIso: string): number {
  const diff = new Date(todayIso).getTime() - new Date(reviewDate).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

const REVIEW_TYPE_LABEL: Record<string, string> = {
  "1": "1 dia",
  "7": "7 dias",
  "21": "21 dias",
  "30": "30 dias",
  manual: "manual",
  dificuldade: "dificuldade",
};

export function Reviews({ reviews, topics, subjects, todayIso, activeSection, onComplete }: Props) {
  const pendingToday = reviews.filter((r) => !r.concluida && r.dataAgendada <= todayIso);
  const isVisible = activeSection === "revisoes";

  return (
    <div
      id="revisoes"
      className={`${
        isVisible ? "block" : "hidden"
      } scroll-mt-24 rounded-2xl border border-slate-800 bg-slate-950 p-4 shadow-lg sm:p-5 xl:block`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-white">Para revisar hoje</h2>
        {pendingToday.length > 0 && (
          <span className="rounded-xl bg-amber-500/15 px-3 py-1 text-sm font-bold text-amber-300">
            {pendingToday.length} pendente{pendingToday.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {pendingToday.length === 0 ? (
          <div className="rounded-xl bg-emerald-500/10 px-4 py-5 text-center ring-1 ring-emerald-500/20">
            <p className="text-sm font-semibold text-emerald-400">Nenhuma revisão pendente para hoje.</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {pendingToday.map((review, index) => {
              const topic = topics[review.topicoId];
              if (!topic) return null;
              const overdueDays = daysOverdue(review.dataAgendada, todayIso);
              const late = overdueDays > 0;

              return (
                <motion.article
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.22, delay: index * 0.05 }}
                  className="relative overflow-hidden rounded-2xl p-4 shadow-md sm:p-5"
                  style={{
                    background: late
                      ? "linear-gradient(135deg, #1c0707 0%, #2d0b0b 100%)"
                      : "linear-gradient(135deg, #1a1200 0%, #271b00 100%)",
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-bold leading-snug text-white">{topic.titulo}</p>
                      <p className="mt-0.5 text-sm text-white/45">
                        {subjects[topic.materiaId]?.nome}
                        <span className="mx-1.5 text-white/20">·</span>
                        revisão de {REVIEW_TYPE_LABEL[review.tipo] ?? review.tipo}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                        late
                          ? "bg-red-500/20 text-red-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}
                    >
                      {late
                        ? `${overdueDays} dia${overdueDays !== 1 ? "s" : ""} atraso`
                        : "Hoje"}
                    </span>
                  </div>

                  <motion.button
                    onClick={() => onComplete(review.id)}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.97 }}
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-bold text-white ring-1 ring-white/15 transition hover:bg-white/18 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white/50"
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                    Concluir revisão
                  </motion.button>
                </motion.article>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
