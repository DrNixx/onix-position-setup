import * as React from 'react';
import { FenEmptyBoard, FenStandartStart, IOpeningPosition } from 'onix-chess';
import { FormControl, FormControlProps } from 'react-bootstrap';
import { Intl  } from './Intl';
import { Intl as IntlCore } from 'onix-core';

export interface StartPosSelectorProps extends FormControlProps {
    fen?: string,
    openingsPos: IOpeningPosition[],
    onChangeFen?: (fen: string) => void,
}

const _ = IntlCore.t;

export class StartPosSelector extends React.Component<StartPosSelectorProps, {}> {
    /**
     * constructor
     */
    constructor(props: StartPosSelectorProps) {
        super(props);
        Intl.register();
    }

    private onChange = (e) => {
        let fen: string = e.target.value; 

        if (fen === "---") {
            fen = window.prompt(_("builder", "paste_fen_prompt"), "");
        }

        if (this.props.onChangeFen) {
            this.props.onChangeFen(fen);
        }
    }

    private getOpenings = (openingsPos) => {
        if (openingsPos && openingsPos.length) {
            let openings = [];
            for (let i = 0; i < openingsPos.length; i++) {
                const option = openingsPos[i];
                openings.push(
                    <option key={i} value={option.fen}>{option.name}</option>
                );
            }

            return (
                <optgroup label={_("builder", "popular_opening")}>
                    {openings}
                </optgroup>
            );

        } else {
            return null;
        }
    }
    
    render() {
        let { fen, openingsPos } = this.props;
        fen = fen || "";
        
        return (
            <FormControl as="select" size="sm" onChange={this.onChange} value={fen}>
                <optgroup label={_("builder", "set_board")}>
                    <option value="">{_("builder", "position_label")}</option>
                    <option value={FenStandartStart}>{_("builder", "std_fen")}</option>
                    <option value={FenEmptyBoard}>{_("builder", "empty_fen")}</option>
                    <option value="---">{_("builder", "get_fen")}</option>
                </optgroup>
                {this.getOpenings(openingsPos)}
            </FormControl>
        );
    }
}
