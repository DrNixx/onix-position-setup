import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Row, Col, Button, FormGroup, FormControl, FormLabel, FormCheck, Container } from 'react-bootstrap';
import { ajax } from 'rxjs/ajax';
import { pushif } from 'onix-core';
import { onixPostMessage } from 'onix-io';
import { Color, Castle, FenStandartStart, Piece, Square, IOpeningPosition } from 'onix-chess';
import { TextWithCopy } from '../TextWithCopy';
import { Intl as IntlCore } from 'onix-core';
import { Intl } from '../Intl';
import * as cg from 'chessground/types';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { SizeSelector } from '../SizeSelector';
import { PieceSelector } from '../PieceSelector';
import { SquareSelector } from '../SquareSelector';
import { StartPosSelector } from '../StartPosSelector';
import { WhoMoveSelector } from '../WhoMoveSelector';
import { BoardSize } from '../Size';

export interface PosBuilderProps {
    locale?: string,
    url?: string,
    dialog?: boolean,

    fen?: string,

    orientation?: cg.Color,
    moveTurn?: boolean,
    whoMove?: cg.Color,
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
    moveTurn?: boolean,
    whoMove?: cg.Color,
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
        moveTurn: false,
        whoMove: 'white',
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

        const { locale, url, dialog, fen, orientation, moveTurn, coordinates, size, piece, square, markers } = this.props;
        
        this.state = {
            openings: [],
            fen: fen,
            orientation: orientation,
            coordinates: coordinates,
            moveTurn: moveTurn,
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

    private resize = (size: BoardSize) => {
        this.setState({
            ...this.state,
            size: size
        });
    }

    private setPieces = (piece: string) => {
        this.setState({
            ...this.state,
            piece: piece
        });
    }

    private setSquares = (square: string) => {
        this.setState({
            ...this.state,
            square: square
        });
    }

    private onStartChange? = (fen) => {
        this.changeStart(fen);
    }

    private changeColor = (color: cg.Color) => {
        this.setState({
            ...this.state,
            whoMove: color
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
        const { dialog } = this.props;
        const { fen, openings, size, orientation, moveTurn, whoMove, coordinates, piece, square, markers } = this.state;

        let params = [];

        pushif(params, (size !== 2), ['size', size]);
        pushif(params, orientation != 'white', ['fb', 1]);
        pushif(params, moveTurn, ['who', 1]);
		pushif(params, !coordinates, ['hl', 1]);
        pushif(params, (piece !== 'merida'), ['pset', encodeURIComponent(piece)]);
        pushif(params, (square !== 'color-blue'), ['sset', encodeURIComponent(square)]);
        pushif(params, !!markers, ['mv', markers])

		const makeLink = () => {
            let img = this.props.url || "https://www.chess-online.com/fen.png"
            img += "?fen=" + encodeURIComponent(fen);

            if (params.length > 0) {
                img += "&" + params.map(function(val){
                    return val.join("=");
                }).join("&")
            }
            
            return img;
        }

        const makeCode = () => {
            let el = document.createElement("div");
            el.innerHTML = encodeURIComponent(fen);            
            
            params.forEach(element => {
                el.setAttribute(element[0], element[1]);
            });
            
            return el.outerHTML.replace(/div/g, "gc:fen");
        }

        const renderDialogButton = () => {
            const executeDialog = () => {
                if (window.parent) {
                    var parent_url = decodeURIComponent(document.location.hash.replace(/^#/, ''));
                    var text = makeCode();
                    onixPostMessage(text, parent_url, parent);
                }
            };

            return (dialog) ? (
                <Row>
                    <Col md={12}><Button block={true} variant="primary" onClick={executeDialog}>{IntlCore.t("builder", "paste_forum_code")}</Button></Col>
                </Row>
            ) : null;
        }

        return (
            <Container className="pos-builder blue">
                <Row>
                    <Col md={12}>
                        <div className="d-block d-lg-flex">
                            <div className="board-container merida">
                                <div className="holder-container">
                                    <ChessHolder store={this.props.store} orient={Orientation.Horizontal} />
                                </div>
                                <div className="main-board" ref={el => this.boardElement = el} />
                                {renderDialogButton()}
                            </div>
                            <div className="controls flex-grow-1">
                                <div className="code-row">
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup controlId="fen">
                                                <FormLabel>{IntlCore.t("chess", "fen")}</FormLabel>
                                                <TextWithCopy value={fen} size="sm" placeholder={IntlCore.t("chess", "fen")} />
                                            </FormGroup>    
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup controlId="image_link">
                                                <FormLabel>{IntlCore.t("builder", "image_link")}</FormLabel>
                                                <TextWithCopy value={makeLink()} size="sm" placeholder={IntlCore.t("builder", "image_link")} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup controlId="forum_code">
                                                <FormLabel>{IntlCore.t("builder", "forum_code")}</FormLabel>
                                                <TextWithCopy value={makeCode()} size="sm" placeholder={IntlCore.t("builder", "forum_code")} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-sets">
                                    <Row>
                                        <Col md={4}>
                                            <FormGroup controlId="size">
                                                <FormLabel>{IntlCore.t("chess", "size")}</FormLabel>
                                                <SizeSelector defaultSize={size} onChangeSize={this.resize} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup controlId="piece">
                                                <FormLabel>{IntlCore.t("chess", "pieces")}</FormLabel>
                                                <PieceSelector defaultPiece={piece} onChangePiece={this.setPieces} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup controlId="square">
                                                <FormLabel>{IntlCore.t("chess", "squares")}</FormLabel>
                                                <SquareSelector defaultSquare={square} onChangeSquare={this.setSquares} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-start">
                                    <Row>
                                        <Col md={8} sm={12}>
                                            <FormGroup controlId="startpos">
                                                <FormLabel srOnly={true}>{IntlCore.t("chess-ctrls", "position_label")}</FormLabel>
                                                <StartPosSelector fen={fen} openingsPos={openings} onChange={this.onStartChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} sm={12}>
                                            <FormGroup controlId="who_move">
                                                <FormLabel srOnly={true}>{IntlCore.t("chess", "who_move")}</FormLabel>
                                                <WhoMoveSelector defaultTurn={whoMove} onChangeTurn={this.changeColor} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-params">
                                    <div><strong>{IntlCore.t("builder", "pos_param")}</strong></div>
                                    <Row>
                                        <Col md={3} sm={6}>
                                            <FormGroup controlId="moveNo">
                                                <FormLabel>{IntlCore.t("chess", "move_no")}</FormLabel>
                                                <FormControl 
                                                    size="sm" 
                                                    value={position.getMoveNo().toString()} 
                                                    onChange={this.changeMoveNo} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormGroup controlId="epTarget">
                                                <FormLabel>{IntlCore.t("chess", "ep_target")}</FormLabel>
                                                <FormControl 
                                                    size="sm"
                                                    value={this.state.ep_target} 
                                                    title={IntlCore.t("builder", "ep_target_hint")} 
                                                    onChange={this.onEpChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup controlId="marks">
                                                <FormLabel>{IntlCore.t("builder", "marks")}</FormLabel>
                                                <FormControl 
                                                    size="sm"
                                                    value={this.state.markers} 
                                                    title={IntlCore.t("builder", "marks_hint")}
                                                    onChange={this.onMarkChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-castle">
                                    <div><strong>{IntlCore.t("chess", "castle")}</strong></div>
                                    <Row>
                                        <Col md={6}>
                                            <div className="color-group">
                                                <label>{IntlCore.t("chess", "white")}</label>
                                                <Row>
                                                    <Col xs={5}>
                                                        <FormCheck 
                                                            id ="wck"
                                                            type="checkbox"
                                                            value={Piece.WKing.toString()}
                                                            onChange={this.onCastleChange}
                                                            defaultChecked={this.hasCastle(Color.White, Castle.KSide)}
                                                            label={Castle.K} />
                                                    </Col>
                                                    <Col xs={7}>
                                                        <FormCheck 
                                                            id ="wcq"
                                                            type="checkbox"
                                                            value={Piece.WQueen.toString()} 
                                                            onChange={this.onCastleChange} 
                                                            defaultChecked={this.hasCastle(Color.White, Castle.QSide)}
                                                            label={Castle.Q} />
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Col>
                                        <Col md={6}>
                                            <div className="color-group">
                                                <label>{IntlCore.t("chess", "black")}</label>
                                                <Row>
                                                    <Col xs={5}>
                                                        <FormCheck 
                                                            id ="bck"
                                                            type="checkbox"
                                                            value={Piece.BKing.toString()} 
                                                            onChange={this.onCastleChange} 
                                                            defaultChecked={this.hasCastle(Color.Black, Castle.KSide)}
                                                            label={Castle.K} />
                                                    </Col>
                                                    <Col xs={7}>
                                                        <FormCheck 
                                                            id ="bcq"
                                                            type="checkbox"
                                                            value={Piece.BQueen.toString()} 
                                                            onChange={this.onCastleChange} 
                                                            defaultChecked={this.hasCastle(Color.Black, Castle.QSide)}
                                                            label={Castle.Q} />
                                                    </Col>
                                                </Row>
                                            </div>
                                        </Col>
                                    </Row>                                
                                </div>
                                <div className="pos-display">
                                    <Row>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="flip" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onFlipChange} 
                                                defaultChecked={flip}
                                                label={IntlCore.t("builder", "display_flip")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="coords" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onCoordsChange} 
                                                defaultChecked={coords}
                                                label={IntlCore.t("builder", "display_coord")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="frame" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onFrameChange} 
                                                defaultChecked={frame}
                                                label={IntlCore.t("builder", "display_frame")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="turn" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onTurnChange} 
                                                defaultChecked={moveturn}
                                                label={IntlCore.t("builder", "display_moveturn")} />
                                        </Col>
                                    </Row>
                                </div>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        );
    }
}

export const PositionSetup = (props: PosBuilderProps, container: HTMLElement) => {
    ReactDOM.render(React.createElement(PosBuilder, props), container);
};