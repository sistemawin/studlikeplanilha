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
      } scroll-mt-24 rounded-2xl border border-white bg-white p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5 sm:p-5 xl:block`}
    >
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
        <h2 className="text-lg font-bold text-slate-950">Para revisar hoje</h2>
        {pendingToday.length > 0 && (
          <span className="w-fit rounded-xl bg-amber-50 px-3 py-1 text-sm font-bold text-amber-700 ring-1 ring-amber-100">
            {pendingToday.length} pendente{pendingToday.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="space-y-3">
        {pendingToday.length === 0 ? (
          <div className="rounded-xl bg-emerald-50 px-4 py-5 text-center ring-1 ring-emerald-100">
            <p className="text-sm font-semibold text-emerald-700">Nenhuma revisão pendente para hoje.</p>
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
                  className="relative overflow-hidden rounded-2xl border p-4 shadow-sm sm:p-5"
                  style={{
                    background: late
                      ? "linear-gradient(135deg, #fff7f7 0%, #ffffff 100%)"
                      : "linear-gradient(135deg, #fffbeb 0%, #ffffff 100%)",
                    borderColor: late ? "#fecaca" : "#fde68a",
                  }}
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-bold leading-snug text-slate-950">{topic.titulo}</p>
                      <p className="mt-0.5 text-sm font-medium text-slate-500">
                        {subjects[topic.materiaId]?.nome}
                        <span className="mx-1.5 text-slate-300">·</span>
                        revisão de {REVIEW_TYPE_LABEL[review.tipo] ?? review.tipo}
                      </p>
                    </div>
                    <span
                      className={`w-fit shrink-0 rounded-xl px-2.5 py-1.5 text-xs font-bold ${
                        late
                          ? "bg-red-50 text-red-700 ring-1 ring-red-100"
                          : "bg-amber-50 text-amber-700 ring-1 ring-amber-100"
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
                    className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#1877F2] text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition hover:bg-[#1B74E4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
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
