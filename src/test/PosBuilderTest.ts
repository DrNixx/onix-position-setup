import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { PosBuilder, PosBuilderProps } from '../js/chess/PosBuilder';

export const PosBuilderTest = (props: PosBuilderProps, container: HTMLElement) => {
    ReactDOM.render(React.createElement(PosBuilder, props), container, () => {});
};

var props: PosBuilderProps = {
    size: 4, 
    orientation: "white",
    dialog: true
};

PosBuilderTest(props, document.getElementById("boardHere")!);
