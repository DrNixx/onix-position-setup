import * as React from 'react';
import { BoardRelatedStore } from '../BoardState';
import { DumbHolder } from './DumbHolder';
import { BoardSize, Orientation, BoardSizeClass } from 'onix-board';

export interface HolderProps {
    store: BoardRelatedStore,
    orient: Orientation,
}

export class ChessHolder extends React.Component<HolderProps, {}> {
    /**
     * constructor
     */
    constructor(props: HolderProps) {
        super(props);
    }

    render() {
        const { store, orient } = this.props;
        return (
            <DumbHolder 
                store={store}
                orient={orient} />
        );
    }
}
