import toSafeInteger from 'lodash-es/toSafeInteger';
import * as classNames from 'classnames';
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Row, Col, Button, FormGroup, FormControl, FormLabel, FormCheck, Container } from 'react-bootstrap';
import { ajax } from 'rxjs/ajax';
import { pushif } from 'onix-core';
import { onixPostMessage } from 'onix-io';
import { Color, Castle, FenStandartStart, Piece, Square, IOpeningPosition, Position } from 'onix-chess';
import { SizeSelector, PieceSelector, SquareSelector, StartPosSelector, WhoMoveSelector } from 'onix-chess-ctrls';
import { TextWithCopy } from '../TextWithCopy';
import { _ } from 'onix-core';
import { Intl } from '../Intl';
import * as cg from 'chessground/types';
import { Chessground } from 'chessground';
import { Api } from 'chessground/api';
import { Config } from 'chessground/config';

import { BoardSize, BoardSizeClass } from 'onix-board-assets';

export interface PosBuilderProps {
    locale?: string,
    url?: string,
    dialog?: boolean,

    fen?: string,

    orientation?: cg.Color,
    moveTurn?: boolean,
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
    moveNo?: number,
    coordinates?: boolean,
    castles?: number[],
    size: BoardSize,
    piece?: string,
    square?: string,
    ep_target?: string,
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
        coordinates: false,

        size: BoardSize.Normal,
        piece: 'merida',
        square: 'color-green',
        markers: '',
    }

    private boardElement: HTMLDivElement;

    private cg: Api = undefined;

    private posMap: string[] = [];

    private r = new RegExp(/(.*)\s\d{1,2}\s\d{1,2}$/);

    private position: Position;

    constructor(props: PosBuilderProps) {
        super(props);

        Intl.register();

        const { locale, url, dialog, fen, orientation, moveTurn, coordinates, size, piece, square, markers } = this.props;

        this.position = new Position(fen || FenStandartStart );
        
        this.state = {
            openings: [],
            fen: fen,
            orientation: orientation,
            coordinates: coordinates,
            moveTurn: moveTurn,
            moveNo: this.position.getMoveNo(),
            castles: [],
            size: size,
            piece: piece,
            square: square,
            ep_target: this.epName(this.position.EpTarget),
            markers: markers,
        };
    }

    componentDidMount() {
        this.cg = Chessground(this.boardElement, this.buildCgConfig());

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

    private buildCgConfig = () => {
        const { state, position, onPositionChange, onDropPiece } = this;

        const config: Config = {
            fen: position.writeFEN(),
            orientation: state.orientation,
            turnColor: position.WhoMove == Color.Black ? 'black' : 'white',
            coordinates: true,
            events: {
                change: onPositionChange,
                dropNewPiece: onDropPiece
            }
        };
        
        return config
    }

    private onPositionChange = () => {
        console.log('onPositionChange');
    }

    private onDropPiece = (piece: cg.Piece, key: cg.Key) => {
        console.log('onDropPiece');
    }

    private getNormFen(fen: string) {
        let keys = this.r.exec(fen);
        return keys[1] || fen;
    }

    private ajaxCallback = (data?: any) => {
        const { state } = this;

        let openings: IOpeningPosition[] = [];
        for (var i = 0; i < data.length; i++) {
            const option = data[i];
            const key = this.getNormFen(option.fen);
            this.posMap[key] = option.fen;
            openings.push(option);
        }
        
        this.setState({
            ...state,
            openings: openings
        });
    }

    private onSizeChange? = (size: BoardSize) => {
        const { state } = this;
        this.setState({
            ...state,
            size: size
        });
    }

    private onPieceChange? = (piece: string) => {
        const { state } = this;
        this.setState({
            ...state,
            piece: piece
        });
    }

    private onSquareChange? = (square: string) => {
        const { state } = this;
        this.setState({
            ...state,
            square: square
        });
    }

    private onStartChange? = (fen) => {
        const { state, position, cg, buildCgConfig } = this;

        position.readFromFEN(fen);
        cg.set(buildCgConfig());

        this.setState({
            ...state,
            fen: fen
        });
    }

    private onMoverChange? = (color: cg.Color) => {
        const { state, position, cg } = this;
        position.WhoMove = color == 'black' ? Color.Black : Color.White;

        this.setState({
            ...state,
            whoMove: color
        });
    }

    private onMoveNoChange? = (e) => {
        const { state, position } = this;
        const n = toSafeInteger(e.target.value);
        this.position.setMoveNo(n);
        this.setState({
            ...state,
            moveNo: n
        });
    }

    private epName? = (ep: number) => {
        return (ep !== Square.NullSquare) ? Square.squareName(ep) : '';
    }

    private onEpChange? = (e) => {
        const { state, position } = this;

        position.EpTarget = Square.parse(e.target.value);
        this.setState({
            ...state,
            fen: position.writeFEN(),
            ep_target: this.epName(position.EpTarget)
        });
    }

    private onMarkChange? = (e) => {
        const { state } = this;
        
        this.setState({
            ...state,
            markers: e.target.value
        });
    }

    private onCastleChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { state, position } = this;

        let color = Color.NoColor;
        let side = Castle.KSide;
        switch (e.target.value) {
            case "1":
                color = Color.White; 
                side = Castle.KSide;
                break;
            case "2":
                color = Color.White; 
                side = Castle.QSide;
                break;
            case "9":
                color = Color.Black; 
                side = Castle.KSide;
                break;
            case "10":
                color = Color.Black; 
                side = Castle.QSide;
                break;
            default:
                break;
        }

        position.setCastling(color, side, e.target.checked);

        this.setState({
            ...state,
            fen: position.writeFEN()
        });
    }

    private hasCastle? = (color: number, side: Castle) => {
        const { position } = this;
        return position.getCastling(color, side);
    }

    private onFlipChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { cg, state } = this;
        const orientation = e.target.checked ? 'black' : 'white';
        if (cg.state.orientation != orientation) {
            cg.toggleOrientation();
        }

        this.setState({
            ...state,
            orientation: orientation
        });
    }

    private onCoordsChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { state } = this;

        this.setState({
            ...state,
            coordinates: e.target.checked
        });
    }

    private onTurnChange? = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { state } = this;

        this.setState({
            ...state,
            moveTurn: e.target.checked
        });
    }

    render() {
        const { cg, props, state } = this;
        const { dialog } = props;
        const { fen, openings, size, orientation, moveTurn, whoMove, moveNo, coordinates, piece, square, markers } = state;

        const flipped = orientation != 'white';

        if (cg !== undefined) {
            cg.set(this.buildCgConfig());
        }

        let params = [];

        pushif(params, (size !== 2), ['size', size]);
        pushif(params, orientation != 'white', ['fb', 1]);
        pushif(params, moveTurn, ['who', 1]);
		pushif(params, !coordinates, ['hl', 1]);
        pushif(params, (piece !== 'merida'), ['pset', encodeURIComponent(piece)]);
        pushif(params, (square !== PosBuilder.defaultProps.square), ['sset', encodeURIComponent(square)]);
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
                    <Col md={12}><Button block={true} variant="primary" onClick={executeDialog}>{_("builder", "paste_forum_code")}</Button></Col>
                </Row>
            ) : null;
        }

        const containerClass = [
            'pos-builder', 
            'is2d',
            square,
            BoardSizeClass[size],
            {'coords-no': !coordinates }
        ];
                
        return (
            <Container className={classNames(containerClass)}>
                <Row>
                    <Col md={12}>
                        <div className="d-block d-lg-flex">
                            <div className={classNames('board-container', piece)}>
                                <div className="holder-container">
                                    
                                </div>
                                <div className="main-board" ref={el => this.boardElement = el} />
                                {renderDialogButton()}
                            </div>
                            <div className="controls flex-grow-1">
                                <div className="code-row">
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup controlId="fen">
                                                <FormLabel>{_("chess", "fen")}</FormLabel>
                                                <TextWithCopy value={fen} size="sm" placeholder={_("chess", "fen")} />
                                            </FormGroup>    
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup controlId="image_link">
                                                <FormLabel>{_("builder", "image_link")}</FormLabel>
                                                <TextWithCopy value={makeLink()} size="sm" placeholder={_("builder", "image_link")} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <Row>
                                        <Col md={12}>
                                            <FormGroup controlId="forum_code">
                                                <FormLabel>{_("builder", "forum_code")}</FormLabel>
                                                <TextWithCopy value={makeCode()} size="sm" placeholder={_("builder", "forum_code")} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-sets">
                                    <Row>
                                        <Col md={4}>
                                            <FormGroup controlId="size">
                                                <FormLabel>{_("chess", "size")}</FormLabel>
                                                <SizeSelector defaultValue={size} onChangeSize={this.onSizeChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup controlId="piece">
                                                <FormLabel>{_("chess", "pieces")}</FormLabel>
                                                <PieceSelector defaultValue={piece} onChangePiece={this.onPieceChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4}>
                                            <FormGroup controlId="square">
                                                <FormLabel>{_("chess", "squares")}</FormLabel>
                                                <SquareSelector defaultValue={square} onChangeSquare={this.onSquareChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-start">
                                    <Row>
                                        <Col md={8} sm={12}>
                                            <FormGroup controlId="startpos">
                                                <FormLabel srOnly={true}>{_("chess-ctrls", "position_label")}</FormLabel>
                                                <StartPosSelector fen={fen} openingsPos={openings} onChangeFen={this.onStartChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={4} sm={12}>
                                            <FormGroup controlId="who_move">
                                                <FormLabel srOnly={true}>{_("chess", "who_move")}</FormLabel>
                                                <WhoMoveSelector defaultValue={whoMove} onChangeTurn={this.onMoverChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-params">
                                    <div><strong>{_("builder", "pos_param")}</strong></div>
                                    <Row>
                                        <Col md={3} sm={6}>
                                            <FormGroup controlId="moveNo">
                                                <FormLabel>{_("chess", "move_no")}</FormLabel>
                                                <FormControl 
                                                    size="sm" 
                                                    defaultValue={moveNo.toString()} 
                                                    onChange={this.onMoveNoChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormGroup controlId="epTarget">
                                                <FormLabel>{_("chess", "ep_target")}</FormLabel>
                                                <FormControl 
                                                    size="sm"
                                                    defaultValue={this.state.ep_target} 
                                                    title={_("builder", "ep_target_hint")} 
                                                    onChange={this.onEpChange} />
                                            </FormGroup>
                                        </Col>
                                        <Col md={6}>
                                            <FormGroup controlId="marks">
                                                <FormLabel>{_("builder", "marks")}</FormLabel>
                                                <FormControl 
                                                    size="sm"
                                                    defaultValue={this.state.markers} 
                                                    title={_("builder", "marks_hint")}
                                                    onChange={this.onMarkChange} />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                </div>

                                <div className="pos-castle">
                                    <div><strong>{_("chess", "castle")}</strong></div>
                                    <Row>
                                        <Col md={6}>
                                            <div className="color-group">
                                                <label>{_("chess", "white")}</label>
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
                                                <label>{_("chess", "black")}</label>
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
                                                defaultChecked={flipped}
                                                label={_("builder", "display_flip")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="coords" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onCoordsChange} 
                                                defaultChecked={coordinates}
                                                label={_("builder", "display_coord")} />
                                        </Col>
                                        <Col md={3} sm={6}>
                                            <FormCheck 
                                                id ="turn" 
                                                type="checkbox"
                                                value="1" 
                                                onChange={this.onTurnChange} 
                                                defaultChecked={moveTurn}
                                                label={_("builder", "display_moveturn")} />
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