import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Unsubscribe } from 'redux';
import { ajax } from 'rxjs/ajax';
import { Color, Castle, FenStandartStart, Piece, Square, Position, IOpeningPosition } from 'onix-chess';
import { DumbPosition } from './DumbPosition';
import { createPositionStore, PositionState, PositionStore } from './PositionStore';
import { BoardSize, BoardSettings, BoardActions, BoardActionConsts as bac } from 'onix-board';

export interface PosBuilderProps {
    board: BoardSettings,
    locale?: string,
    url?: string,
    dialog?: boolean,
}

export interface PosBuilderState {
    openings: IOpeningPosition[],
}

export class PosBuilder extends React.Component<PosBuilderProps, PosBuilderState> {
    private store: PositionStore;
    private storeUnsubscribe: Unsubscribe;
    private posMap: string[] = [];
    private r = new RegExp(/(.*)\s\d{1,2}\s\d{1,2}$/);

    constructor(props: PosBuilderProps) {
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
                position: new Position(fena),
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
            ajax({ url:'https://www.chess-online.com/api/position/starting-positions', crossDomain: true })
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

    canMove = (from: number, to: number): boolean => {
        if (typeof to === "undefined") {
            return typeof from !== "undefined";
        }

        // const state: PositionState = this.store.getState();
        return true; // (to == Square.NullSquare) || (state.board.position.getPiece(to) == Piece.NoPiece);
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

export const PositionSetup = (props: PosBuilderProps, container: HTMLElement) => {
    ReactDOM.render(React.createElement(PosBuilder, props), container);
};