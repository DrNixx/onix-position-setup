import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Unsubscribe } from 'redux';
import { Observable } from 'rxjs';
import { Color, Castle, FenStandartStart, Piece, Square, Position } from 'onix-chess';
import { BoardSize } from 'onix-board';
import { OpeningPosition } from './Constants';
import { BoardSettings } from 'onix-board';
import { DumbPosition } from './DumbPosition';
import { createPositionStore, PositionState, PositionStore } from './PositionStore';
import { BoardState } from '../BoardState';
import { BoardAction } from '../BoardActions';
import * as boardActions from '../BoardActionConsts';
import { Logger } from 'onix-core';

export interface ChessPositionProps {
    board: BoardSettings,
    locale?: string,
    url?: string,
    dialog?: boolean,
}

interface ChessPositionState {
    openings: OpeningPosition[],
}

export class ViewPosition extends React.Component<ChessPositionProps, ChessPositionState> {
    private store: PositionStore;
    private storeUnsubscribe: Unsubscribe;
    private posMap: string[] = [];
    private r = new RegExp(/(.*)\s\d{1,2}\s\d{1,2}$/);

    constructor(props: ChessPositionProps) {
        super(props);

        const { locale, board } = this.props;
        const { size, piece, square, flip, coords, frame, fen, markers } = board;
        const { canMove, doMove } = this;
        const fena = fen || FenStandartStart;
        
        this.store = createPositionStore({
            intl: {
                locale: locale
            },
            board: {
                size: size || BoardSize.Normal,
                piece: piece || "merida",
                square: square || "color-blue",
                flip: !!flip,
                coords: (typeof coords !== "undefined") ? !!coords : true,
                frame: (typeof frame !== "undefined") ? !!frame : true,
                moveturn: true,
                position: new ChessPosition(fena),
                fen: fena,
                markers: markers,
                selection: {
                    from: {
                        piece: Piece.NoPiece,
                        square: Square.NullSquare
                    }
                },
                canMove: canMove,
                doMove: doMove
            }
        });

        this.state = {
            openings: []
        };
    }

    componentDidMount() {
        this.storeUnsubscribe = this.store.subscribe(() =>
            this.forceUpdate()
        );

        if (process.env.NODE_ENV === 'production') {
            const ajaxCallback = this.ajaxCallback;
            Observable.ajax({ url:'https://www.chess-online.com/api/position/starting-positions', crossDomain: true })
                .subscribe(
                    function (data) {
                        ajaxCallback(data.response); 
                    }
                );
        }
    }

    componentWillUnmount() {
        this.storeUnsubscribe();
    }

    private getNormFen(fen: string) {
        let keys = this.r.exec(fen);
        return keys[1] || fen;
    }

    private ajaxCallback = (data?: any) => {
        let openings: OpeningPosition[] = [];
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
        this.store.dispatch({ type: boardActions.FLIP_BOARD, flag: flag } as BoardAction);
    }

    private setCoords = (flag: boolean) => {
        this.store.dispatch({ type: boardActions.SET_COORDS, flag: flag } as BoardAction);
    }

    private setFrame = (flag: boolean) => {
        this.store.dispatch({ type: boardActions.SET_FRAME, flag: flag } as BoardAction);
    }

    private setMoveTurn = (flag: boolean) => {
        this.store.dispatch({ type: boardActions.SET_MOVETURN, flag: flag } as BoardAction);
    }

    private resize = (size: BoardSize) => {
        this.store.dispatch({ type: boardActions.CHANGE_SIZE, size: size } as BoardAction);
    }

    private setPieces = (piece: string) => {
        this.store.dispatch({ type: boardActions.SET_PIECE, piece: piece } as BoardAction);
    }

    private setSquares = (square: string) => {
        this.store.dispatch({ type: boardActions.SET_SQUARE, square: square } as BoardAction);
    }

    private changeColor = (color) => {
        this.store.dispatch({ type: boardActions.WHO_MOVE, color: color } as BoardAction);
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
            this.store.dispatch({ type: boardActions.SET_CASTLE, color: color, side: side, flag: flag } as BoardAction);
        }
    }

    private changeMoveNo = (move: number) => {
        this.store.dispatch({ type: boardActions.SET_MOVENO, move: move } as BoardAction);
    }

    private changeEp = (sq: number) => {
        this.store.dispatch({ type: boardActions.SET_EP, ep_target: sq } as BoardAction);
    }

    private changeStart? = (fen: string) => {
        if (fen) {
            this.changeFen(fen);
        }
    }

    private changeFen = (fen: string) => {
        this.store.dispatch({ type: boardActions.SET_FEN, fen: fen } as BoardAction);
    }

    canMove = (from: number, to: number): boolean => {
        if (typeof to === "undefined") {
            return typeof from !== "undefined";
        }

        // const state: PositionState = this.store.getState();
        return true; // (to == Square.NullSquare) || (state.board.position.getPiece(to) == Piece.NoPiece);
    }

    doMove = (from: number, to: number, piece: number) => {
        const state: PositionState = this.store.getState();
        const position = state.board.position;

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

    private getPosition = () => {
        const state: PositionState = this.store.getState();
        return state.board.position;
    }

    render() {
        const state: PositionState = this.store.getState();
        const { openings } = this.state;

        return (
            <DumbPosition 
                store={this.store}
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

export const PositionSetup = (props: ChessPositionProps, container: HTMLElement) => {
    ReactDOM.render(React.createElement(ViewPosition, props), container);
};