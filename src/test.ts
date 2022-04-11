import { jsxTransform } from "emitkit";
import plugin from "./transform.js";

const transformed = await jsxTransform(
  `

export default () => {
  const [state, setState] = React.useState(0);
  let [, rerender] = useReducer((a) => ~a, 0);
  Reactor.useEffect(() => console.log(state));

  const myRef = useRef();

  return (
    <>
      <button onClick={() => setState(state * 2)} style={\`color: red\`} />
      {state}
      <div style={{ marginRight: "5rem" }}>
        <span ref={myRef} />
      </div>
    </>
  );
};

`,
  { plugin }
);

console.log(transformed.code);
