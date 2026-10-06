"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Button, Card, ParticipantTag } from "@/components/ui";

export interface Person {
  id: string;
  alias: string;
  slot: number;
}

type Phase = { kind: "handoff"; index: number } | { kind: "private"; index: number } | { kind: "neutral"; index: number };

/**
 * Ronda privada con entrega del teléfono. Las respuestas viven solo en esta
 * instancia (memoria) y se entregan juntas al final; la pantalla neutral es
 * idéntica sea cual sea la respuesta, y no se revela nada anticipadamente.
 */
export function PrivateRound<T>({
  people,
  title,
  renderPrivate,
  onComplete,
  onCancel,
  cancelLabel = "Cancelar",
}: {
  people: Person[];
  title: string;
  renderPrivate: (person: Person, submit: (value: T) => void) => ReactNode;
  onComplete: (answers: Map<string, T>) => void;
  onCancel?: () => void;
  cancelLabel?: string;
}) {
  // Respuestas solo en memoria de esta ronda (no es estado de render).
  const [answers] = useState(() => new Map<string, T>());
  const [phase, setPhase] = useState<Phase>({ kind: "handoff", index: 0 });
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => () => answers.clear(), [answers]);

  useEffect(() => {
    headingRef.current?.focus();
  }, [phase]);

  const person = people[phase.index];
  if (!person) return null;

  const submit = (value: T) => {
    answers.set(person.id, value);
    setPhase({ kind: "neutral", index: phase.index });
  };

  const next = () => {
    const idx = phase.index + 1;
    if (idx >= people.length) {
      const copy = new Map(answers);
      answers.clear();
      onComplete(copy);
      return;
    }
    setPhase({ kind: "handoff", index: idx });
  };

  if (phase.kind === "handoff") {
    return (
      <Card className="space-y-4 text-center animate-in">
        <p className="text-sm uppercase tracking-widest text-faint">{title}</p>
        <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold">
          Entrega el teléfono a <ParticipantTag alias={person.alias} slot={person.slot} />
        </h2>
        <p className="text-muted">Las demás personas no deben mirar la pantalla. Nadie verá tu respuesta.</p>
        <p className="text-sm text-faint">
          Persona {phase.index + 1} de {people.length}
        </p>
        <Button block onClick={() => setPhase({ kind: "private", index: phase.index })}>
          Soy {person.alias}, continuar
        </Button>
        {onCancel && (
          <Button variant="quiet" onClick={onCancel}>
            {cancelLabel}
          </Button>
        )}
      </Card>
    );
  }

  if (phase.kind === "private") {
    return (
      <div className="animate-in" aria-live="off">
        <h2 ref={headingRef} tabIndex={-1} className="sr-only">
          Respuesta privada de {person.alias}
        </h2>
        {renderPrivate(person, submit)}
      </div>
    );
  }

  return (
    <Card className="space-y-4 text-center animate-in">
      <h2 ref={headingRef} tabIndex={-1} className="text-2xl font-bold">
        Gracias
      </h2>
      <p className="text-muted">Tu respuesta quedó guardada en privado.</p>
      <Button block onClick={next}>
        {phase.index + 1 < people.length ? "Ocultar y pasar el teléfono" : "Ocultar y ver el resultado"}
      </Button>
    </Card>
  );
}

/** Autorización unánime: sí/no privados, resultado solo agregado. */
export function ConsentRound({
  people,
  title,
  question,
  detail,
  onResult,
  onCancel,
}: {
  people: Person[];
  title: string;
  question: ReactNode;
  detail?: ReactNode;
  onResult: (accepted: boolean) => void;
  onCancel?: () => void;
}) {
  return (
    <PrivateRound<boolean>
      people={people}
      title={title}
      onCancel={onCancel}
      renderPrivate={(p, submit) => (
        <Card className="space-y-4">
          <p className="text-sm text-faint">
            Respuesta privada de <ParticipantTag alias={p.alias} slot={p.slot} />
          </p>
          <div className="text-xl font-semibold">{question}</div>
          {detail && <div className="text-muted">{detail}</div>}
          <p className="text-sm text-muted">Puedes decir que no sin dar explicaciones. Nadie sabrá qué respondiste.</p>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={() => submit(false)}>
              No
            </Button>
            <Button variant="secondary" onClick={() => submit(true)}>
              Sí
            </Button>
          </div>
        </Card>
      )}
      onComplete={(answers) => {
        // Unanimidad: una ausencia de respuesta nunca equivale a sí.
        const all = people.every((p) => answers.get(p.id) === true);
        onResult(all);
      }}
    />
  );
}
