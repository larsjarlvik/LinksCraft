import { Component } from "../../engine/ecs";

export class Mesh extends Component {
    public name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }
}
