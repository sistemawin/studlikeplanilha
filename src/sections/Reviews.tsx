import { CheckCircle2 } from "lucide-react";
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

export function Reviews({ reviews, topics, subjects, todayIso, activeSection, onComplete }: Props) {
  const pendingToday = reviews.filter((r) => !r.concluida && r.dataAgendada <= todayIso);
  const isVisible = activeSection === "revisoes";

  return (
    <div
      id="revisoes"
      className={`${
        isVisible ? "block" : "hidden"
      } scroll-mt-24 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-900/5 sm:p-5 lg:block`}
    >
      <h2 className="text-lg font-semibold">Para revisar hoje</h2>
      <div className="mt-4 space-y-3">
        {pendingToday.length === 0 ? (
          <p className="rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800">
            Nenhuma revisão pendente para hoje.
          </p>
        ) : (
          pendingToday.map((review) => {
            const topic = topics[review.topicoId];
            if (!topic) return null;
            const overdueDays = daysOverdue(review.dataAgendada, todayIso);
            const late = overdueDays > 0;

            return (
              <article
                key={review.id}
                className={`rounded-xl border p-4 ${
                  late ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{topic.titulo}</p>
                    <p className="text-sm text-slate-600">
                      {subjects[topic.materiaId]?.nome} · tipo {review.tipo}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${
                      late
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {late
                      ? `${overdueDays} dia${overdueDays !== 1 ? "s" : ""} de atraso`
                      : "Hoje"}
                  </span>
                </div>
                <button
                  onClick={() => onComplete(review.id)}
                  className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-semibold text-white hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
                >
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  Concluir revisão
                </button>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
