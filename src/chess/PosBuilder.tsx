import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { ajax } from 'rxjs/ajax';
import { Color, Castle, FenStandartStart, Piece, Square, IOpeningPosition } from 'onix-chess';
import { DumbPosition } from './DumbPosition';
import * as cg from 'chessground/types'
import { Chessground } from 'chessground'
import { Api } from 'chessground/api';

export const BoardSizeClass: string[] = ["size1", "size1", "size2", "size3", "size4", "size5", "size6"];

/**
 * Размеры доски
 */
export enum BoardSize {
    None = 0,
    Tiny = 1,
    Small = 2,
    Smallest = 3,
    Normal = 4,
    Largest = 5,
    Large = 6
}

export interface PosBuilderProps {
    locale?: string,
    url?: string,
    dialog?: boolean,

    fen?: string,

    orientation?: cg.Color,
    whoMove?: boolean,
    coordinates?: boolean,

    size: BoardSize,
    piece?: string,
    square?: string,
    markers?: string,
}

export interface PosBuilderState {
    openings: IOpeningPosition[],
    fen?: string,
    orientation?: cg.Color,
    whoMove?: boolean,
    coordinates?: boolean,
    castles?: number[],
    size: BoardSize,
    piece?: string,
    square?: string,
    markers?: string,
}

export class PosBuilder extends React.Component<PosBuilderProps, PosBuilderState> {
    public static defaultProps: PosBuilderProps = {
        locale: 'ru-ru',
        url: 'https://www.chess-online.com/fen.png',
        dialog: false,

        fen: FenStandartStart,

        orientation: 'white',
        whoMove: false,
        coordinates: true,

        size: BoardSize.Normal,
        piece: 'merida',
        square: 'blue',
        markers: '',
    }

    private boardElement: HTMLDivElement;

    private cg: Api;

    private posMap: string[] = [];
    private r = new RegExp(/(.*)\s\d{1,2}\s\d{1,2}$/);

    constructor(props: PosBuilderProps) {
        super(props);

        const { locale, url, dialog, fen, orientation, whoMove, coordinates, size, piece, square, markers } = this.props;
        
        this.state = {
            openings: [],
            fen: fen,
            orientation: orientation,
            coordinates: coordinates,
            whoMove: whoMove,
            castles: [],
            size: size,
            piece: piece,
            square: square,
            markers: markers,
        };
    }

    componentDidMount() {
        this.cg = Chessground(this.boardElement, {});

        if (process.env.NODE_ENV === 'production') {
            const ajaxCallback = this.ajaxCallback;
            ajax({ url:'https://www.chess-online.com/api/position/starting-positions', crossDomain: true })
                .subscribe(
                    function (data) {
                        ajaxCallback(data.response); 
                    }
                );
        }
    }
        
    componentWillUnmount() {
        this.cg.destroy()
    }

    private getNormFen(fen: string) {
        let keys = this.r.exec(fen);
        return keys[1] || fen;
    }

    private ajaxCallback = (data?: any) => {
        let openings: IOpeningPosition[] = [];
        for (var i = 0; i < data.length; i++) {
            const option = data[i];
            const key = this.getNormFen(option.fen);
            this.posMap[key] = option.fen;
            openings.push(option);
        }
        
        this.setState({
            ...this.state,
            openings: openings
        });
    }

    private flipBoard = (flag: boolean) => {
        this.store.dispatch({ type: bac.FLIP_BOARD, flag: flag } as BoardActions.BoardAction);
    }

    private setCoords = (flag: boolean) => {
        this.store.dispatch({ type: bac.SET_COORDS, flag: flag } as BoardActions.BoardAction);
    }

    private setFrame = (flag: boolean) => {
        this.store.dispatch({ type: bac.SET_FRAME, flag: flag } as BoardActions.BoardAction);
    }

    private setMoveTurn = (flag: boolean) => {
        this.store.dispatch({ type: bac.SET_MOVETURN, flag: flag } as BoardActions.BoardAction);
    }

    private resize = (size: BoardSize) => {
        this.store.dispatch({ type: bac.CHANGE_SIZE, size: size } as BoardActions.BoardAction);
    }

    private setPieces = (piece: string) => {
        this.store.dispatch({ type: bac.SET_PIECE, piece: piece } as BoardActions.BoardAction);
    }

    private setSquares = (square: string) => {
        this.store.dispatch({ type: bac.SET_SQUARE, square: square } as BoardActions.BoardAction);
    }

    private changeColor = (color: number) => {
        this.store.dispatch({ type: bac.WHO_MOVE, color: color } as BoardActions.BoardAction);
    }

    private changeCastle = (flag: boolean, val: string) => {
        let color = Color.NoColor;
        let side = Castle.KSide;
        switch (val) {
            case "1":
                color = Color.White; side = Castle.KSide;
                break;
            case "2":
                color = Color.White; side = Castle.QSide;
                break;
            case "9":
                color = Color.Black; side = Castle.KSide;
                break;
            case "10":
                color = Color.Black; side = Castle.QSide;
                break;
            default:
                break;
        }

        if (color !== Color.NoColor) {
            this.store.dispatch({ type: bac.SET_CASTLE, color: color, side: side, flag: flag } as BoardActions.BoardAction);
        }
    }

    private changeMoveNo = (move: number) => {
        this.store.dispatch({ type: bac.SET_MOVENO, move: move } as BoardActions.BoardAction);
    }

    private changeEp = (sq: number) => {
        this.store.dispatch({ type: bac.SET_EP, ep_target: sq } as BoardActions.BoardAction);
    }

    private changeStart? = (fen: string) => {
        if (fen) {
            this.changeFen(fen);
        }
    }

    private changeFen = (fen: string) => {
        this.store.dispatch({ type: bac.SET_FEN, fen: fen } as BoardActions.BoardAction);
    }

    doMove = (from: number, to: number, piece: number, position: Position) => {
        if (from !== Square.NullSquare) {
            piece = piece || position.getPiece(from);
            if (!position.removePiece(piece, from)) {
                return false;
            }
        }

        if (piece && to !== Square.NullSquare) {
            const captured = position.getPiece(to)
            if (captured !== Piece.NoPiece) {
                position.removePiece(captured, to);
            }

            if (!position.addPiece(piece, to)) {
                return false;
            }
        }

        let fen = position.writeFEN();
        const key = this.getNormFen(fen);
        if (this.posMap[key]) {
            if (fen !== this.posMap[key]) {
                fen = this.posMap[key];
            }
        }

        return fen;
    }

    render() {
        const { openings } = this.state;

        return (
            <DumbPosition 
                url={this.props.url || "https://www.chess-online.com/fen.png"}
                dialog={this.props.dialog}
                openingsPos={openings}
                flipBoard={this.flipBoard}
                setCoords={this.setCoords}
                setFrame={this.setFrame}
                resize={this.resize}
                setPieces={this.setPieces}
                setSquares={this.setSquares}
                setMoveTurn={this.setMoveTurn}
                changeCastle={this.changeCastle}
                changeColor={this.changeColor}
                changeMoveNo={this.changeMoveNo}
                changeEp={this.changeEp}
                changeFen={this.changeFen}
                changeStart={this.changeStart} />
        );
    }
}

export const PositionSetup = (props: PosBuilderProps, container: HTMLElement) => {
    ReactDOM.render(React.createElement(PosBuilder, props), container);
};