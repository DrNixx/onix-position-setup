import * as React from 'react';
import { FormControl, FormControlProps } from 'react-bootstrap';

export interface SquareSelectorProps extends FormControlProps {
    defaultSquare?: string;
    onChangeSquare?: (square: string) => void;
}

export class SquareSelector extends React.Component<SquareSelectorProps, {}> {
    public static defaultProps: SquareSelectorProps = {
        defaultSquare: 'color-blue',
    }

    /**
     * constructor
     */
    constructor(props: SquareSelectorProps) {
        super(props);
    }

    private onChange = (e) => {
        const { onChangeSquare } = this.props;
        const square = e.target.value; 

        if (onChangeSquare) {
            onChangeSquare(square);
        }
    }

    render() {
        const { defaultSquare } = this.props;
        return (
            <FormControl as="select" size="sm" onChange={this.onChange} defaultValue={defaultSquare}>
                <option value="blue-marble">Blue-marble</option>
                    <option value="cedar">Cedar</option>
                    <option value="color-blue">Color blue</option>
                    <option value="color-brown">Color brown</option>
                    <option value="color-gray">Color gray</option>
                    <option value="color-green">Color green</option>
                    <option value="elm">Elm</option>
                    <option value="granite">Granite</option>
                    <option value="green-marble">Green-marble</option>
                    <option value="red-marble">Red-marble</option>
                    <option value="red-wood">Red-wood</option>
                    <option value="rust-metal">Rust-metal</option>
                    <option value="tan-marble">Tan-marble</option>
                    <option value="walnut">Walnut</option>
            </FormControl>
        );
    }
}