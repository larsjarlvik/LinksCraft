export interface Shader {
    vert: string;
    frag: string;
}

export const fetchShader = async (name: string): Promise<Shader> => {
    const response = await fetch(`/shaders/${name}.wgsl`);
    const shader = await response.text();

    const vert = shader.substring(0, shader.indexOf("@fragment"));
    const frag = shader.substring(shader.indexOf("@fragment"));

    return { vert, frag };
};
