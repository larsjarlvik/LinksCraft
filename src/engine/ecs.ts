import { Context } from './context';

export type Entity = number;

export enum Target {
    Update = 'update',
    Render = 'render'
}

export abstract class Component {
    public prevState: Component | null = null;
    public clone() { };
}

export abstract class System {
    public abstract target: Target;
    public abstract componentsRequired: Set<Function>;
    public abstract update(entities: Set<Entity>, ctx: Context): void;
    public ecs: ECS;
}

// biome-ignore lint/suspicious/noExplicitAny: It's generic on purpose
type ComponentClass<T extends Component> = new (...args: any[]) => T;

class ComponentContainer {
    private map = new Map<Function, Component>();

    public add(component: Component) {
        this.map.set(component.constructor, component);
    }
    public get<T extends Component>(componentClass: ComponentClass<T>): T {
        return this.map.get(componentClass) as T;
    }

    public has(componentClass: Function): boolean {
        return this.map.has(componentClass);
    }

    public hasAll(componentClasses: Iterable<Function>): boolean {
        for (const cls of componentClasses) {
            if (!this.map.has(cls)) {
                return false;
            }
        }
        return true;
    }

    public delete(componentClass: Function) {
        this.map.delete(componentClass);
    }

    public clone() {
        for (const component of this.map.values()) {
            component.clone();
        }
    }
}

export class ECS {
    private entities = new Map<Entity, ComponentContainer>();
    private systems = new Map<System, Set<Entity>>();

    private nextEntityID = 0;
    private entitiesToDestroy = new Array<Entity>();

    public addEntity(components: Component[] = []): Entity {
        const entity = this.nextEntityID;
        this.nextEntityID++;
        this.entities.set(entity, new ComponentContainer());

        for (const component of components) {
            this.addComponent(entity, component);
        }

        return entity;
    }

    public removeEntity(entity: Entity) {
        this.entitiesToDestroy.push(entity);
    }

    public addComponent(entity: Entity, component: Component) {
        this.entities.get(entity).add(component);
        this.checkE(entity);
    }

    public getComponents(entity: Entity): ComponentContainer {
        return this.entities.get(entity);
    }

    public removeComponent(entity: Entity, componentClass: Function) {
        this.entities.get(entity).delete(componentClass);
        this.checkE(entity);
    }

    public addSystem(system: System) {
        if (system.componentsRequired.size === 0) {
            console.warn('System not added: empty Components list.');
            console.warn(system);
            return;
        }

        system.ecs = this;

        this.systems.set(system, new Set());
        for (const entity of this.entities.keys()) {
            this.checkES(entity, system);
        }
    }

    public addSystems(systems: System[]) {
        for (const system of systems) {
            this.addSystem(system);
        }
    }

    public removeSystem(system: System) {
        this.systems.delete(system);
    }

    public update(ctx: Context, target: Target) {
        for (const [system, entities] of this.systems.entries()) {
            if (system.target !== target) continue;
            system.update(entities, ctx);
        }

        while (this.entitiesToDestroy.length > 0) {
            this.destroyEntity(this.entitiesToDestroy.pop());
        }
    }

    public store() {
        for (const componentContainer of this.entities.values()) {
            componentContainer.clone();
        }
    }

    private destroyEntity(entity: Entity) {
        this.entities.delete(entity);
        for (const entities of this.systems.values()) {
            entities.delete(entity); // no-op if doesn't have it
        }
    }

    private checkE(entity: Entity) {
        for (const system of this.systems.keys()) {
            this.checkES(entity, system);
        }
    }

    private checkES(entity: Entity, system: System) {
        const have = this.entities.get(entity);
        const need = system.componentsRequired;

        if (have.hasAll(need)) {
            this.systems.get(system).add(entity);
        } else {
            this.systems.get(system).delete(entity);
        }
    }
}
