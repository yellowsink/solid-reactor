# Reactor

A compat layer to ease the move from React to SolidJS.

## Notes

As your Solid components are only called once, useRef is useless, and a simple let binding can be used.
The useRef in this library is a no-op and just errors to notify you of this in case you try to use it.

This tool is intended mainly to help you move from React to Solid.
Some oddities like accurate tracking of dependencies cannot be guaranteed,
and it's highly recommended to move to Solid's reactivity tools as soon as possible.

Your goal should be to eliminate Reactor from your Solid app ASAP once migration is done.

A Solid version of `useReducer`, `createReducer` is provided.
This is the one function in this lib that is a proper Solid reactivity function and not a React replacement.
It can be used while converting Reactor's reactivity to Solid's,
and bridges the gap before you may or may not choose to replace it with a useState and a custom setter.

This layer may work successfully in running simple React components in Solid, and you are welcome to attempt it,
but view it more as a conversion tool so that you can drop in a React component,
convert what is not supported in Reactor, and save the proper Solid conversion for after you have a functioning app.

Do not expect the same performance from Reactor as Solid.
It will almost certainly beat React by a long shot, but the way Solid does deps makes its reactivity basically unbeatable.

Expect to replace the `className` prop on JSX elements with `class`.
Without patching over Solid's JSX support or providing our own wrapper, Reactor cannot do this for you.

## An example Reactor component
```js
// top tip! import reactor as React to make it work neatly with many components that will expect that global to exist
import * as React from "solid-reactor";

export default () => {
  const [count, increment] = React.useReducer(c => c + 1, 0);
  const [text, setText] = React.useState("");

  return (
    <>
      <div>{count}</div>
      <button onClick={increment}>increment</button>

      <input type="text" value={text} onInput={setText} />
    </>
  );
}

// is equivalent to
const isTheSameAs = () => {
  const [count, setCount] = createSignal(0);
  const increment = () => setCount(c => c + 1);
  // const [count, increment] = React.createReducer(c => c + 1, 0); // if you prefer
  const [text, setText] = createSignal("");

  return (
    <>
      <div>{count()}</div>
      <button onClick={increment}>increment</button>

      <input type="text" value={text()} onInput={setText} />
    </>
  );
}
```

As you can see, the Solid code is just as readable, tracks dependencies more accurately and probably performantly,
so you really should start to move away from Reactor as soon as your app is working.