import transform from "./transform.js";

const transformed = await transform(`

export default () => {
  const [state, setState] = React.useState(0);
  let [, rerender] = useReducer(a => ~a, 0);
  Reactor.useEffect(() => console.log(state));

  const myRef = useRef();

  return (
    <>
      <button onClick={() => setState(state * 2)}/>
      {state}
      <div>
        <span ref={myRef}/>
      </div>
    </>
  );
}

`);

console.log(transformed);
