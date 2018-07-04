import * as React from 'react';
import { BoardRelatedStore } from 'onix-board';
import { DumbHolder } from './DumbHolder';
import { Orientation } from 'onix-board';

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
