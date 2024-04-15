import type { Context } from "./context";

export type Entity = number;

export abstract class Component {}

export abstract class System {
    // biome-ignore lint/complexity/noBannedTypes: It's generic on purpose
    public abstract componentsRequired: Set<Function>;

    public abstract update(ctx: Context, entities: Set<Entity>): void;

    public ecs: ECS;
}

// biome-ignore lint/suspicious/noExplicitAny: It's generic on purpose
type ComponentClass<T extends Component> = new (...args: any[]) => T;

class ComponentContainer {
    // biome-ignore lint/complexity/noBannedTypes: It's generic on purpose
    private map = new Map<Function, Component>();

    public add(component: Component) {
        this.map.set(component.constructor, component);
    }
    public get<T extends Component>(componentClass: ComponentClass<T>): T {
        return this.map.get(componentClass) as T;
    }

    // biome-ignore lint/complexity/noBannedTypes: It's generic on purpose
    public has(componentClass: Function): boolean {
        return this.map.has(componentClass);
    }

    // biome-ignore lint/complexity/noBannedTypes: It's generic on purpose
    public hasAll(componentClasses: Iterable<Function>): boolean {
        for (const cls of componentClasses) {
            if (!this.map.has(cls)) {
                return false;
            }
        }
        return true;
    }

    // biome-ignore lint/complexity/noBannedTypes: It's generic on purpose
    public delete(componentClass: Function): void {
        this.map.delete(componentClass);
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

    public removeEntity(entity: Entity): void {
        this.entitiesToDestroy.push(entity);
    }

    public addComponent(entity: Entity, component: Component): void {
        this.entities.get(entity).add(component);
        this.checkE(entity);
    }

    public getComponents(entity: Entity): ComponentContainer {
        return this.entities.get(entity);
    }

    // biome-ignore lint/complexity/noBannedTypes: It's generic on purpose
    public removeComponent(entity: Entity, componentClass: Function): void {
        this.entities.get(entity).delete(componentClass);
        this.checkE(entity);
    }

    public addSystem(system: System): void {
        if (system.componentsRequired.size === 0) {
            console.warn("System not added: empty Components list.");
            console.warn(system);
            return;
        }

        system.ecs = this;

        this.systems.set(system, new Set());
        for (const entity of this.entities.keys()) {
            this.checkES(entity, system);
        }
    }

    public removeSystem(system: System): void {
        this.systems.delete(system);
    }

    public update(ctx: Context): void {
        for (const [system, entities] of this.systems.entries()) {
            system.update(ctx, entities);
        }

        while (this.entitiesToDestroy.length > 0) {
            this.destroyEntity(this.entitiesToDestroy.pop());
        }
    }

    private destroyEntity(entity: Entity): void {
        this.entities.delete(entity);
        for (const entities of this.systems.values()) {
            entities.delete(entity); // no-op if doesn't have it
        }
    }

    private checkE(entity: Entity): void {
        for (const system of this.systems.keys()) {
            this.checkES(entity, system);
        }
    }

    private checkES(entity: Entity, system: System): void {
        const have = this.entities.get(entity);
        const need = system.componentsRequired;

        if (have.hasAll(need)) {
            this.systems.get(system).add(entity);
        } else {
            this.systems.get(system).delete(entity);
        }
    }
}
