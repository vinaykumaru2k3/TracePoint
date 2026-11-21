export default function LearnList({ lesson, steps, reached }) {
  const done = lesson.learn.map(([, test]) => steps.slice(0, reached + 1).some(test));
  const count = done.filter(Boolean).length;
  return (
    <div className="learn">
      <div className="lbl"><span>You will learn</span><span>{count} / {lesson.learn.length}</span></div>
      <ul>
        {lesson.learn.map(([text], k) => (
          <li key={k} className={done[k] ? "got" : ""}>
            <i>✓</i><span>{text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
