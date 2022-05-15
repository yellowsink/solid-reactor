import { jsxTransform } from "emitkit";
import plugin from "./transform.js";
import * as swc from "@swc/core";

const transformed = jsxTransform(swc)(
  `

import { useReducer } from "react";

export default ({a, b}) => {
  const [state, setState] = React.useState(0);
  let [, rerender] = useReducer((a) => ~a, 0);
  Reactor.useEffect((b) => console.log(state, b));

  const myRef = useRef();

  return (
    <>
      <button onClick={() => setState(state * 2)} style={\`color: red\`} />
      {state}
      <div style={{ marginRight: "5rem" }}>
        <span ref={myRef} />
        {a}
      </div>
    </>
  );
};

`,
  { plugin }
);

console.log(transformed.code);
