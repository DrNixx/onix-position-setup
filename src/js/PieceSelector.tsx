import * as React from 'react';
import { FormControl, FormControlProps } from 'react-bootstrap';

const boardsData = require('onix-board-assets/dist/assets/pieces/pieces.json');

export interface PieceSelectorProps extends FormControlProps {
    defaultPiece?: string;
    onChangePiece?: (piece: string) => void;
}

export class PieceSelector extends React.Component<PieceSelectorProps, {}> {
    public static defaultProps: PieceSelectorProps = {
        defaultPiece: 'merida',
    }

    /**
     * constructor
     */
    constructor(props: PieceSelectorProps) {
        super(props);
    }

    private onChange = (e) => {
        const { onChangePiece } = this.props;
        const piece = e.target.value; 

        if (onChangePiece) {
            onChangePiece(piece);
        }
    };

    private getPieces = () => {
        let result = [];
        boardsData.pieceFaces.forEach(element => {
            result.push(
                <option key={element.code} value={element.code}>{element.name}</option>
            );
        });

        return result;
    };

    render() {
        const { defaultPiece } = this.props;

        return (
            <FormControl as="select" size="sm" onChange={this.onChange} defaultValue={defaultPiece}>
                {this.getPieces()}
            </FormControl>
        );
    }
}