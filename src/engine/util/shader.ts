export interface Shader {
    shader: string;
    vert: string;
    frag: string;
}

export const fetchShader = async (name: string): Promise<Shader> => {
    const response = await fetch(`shaders/${name}.wgsl`);
    const shader = await response.text();

    const vert = shader.substring(0, shader.indexOf('// Fragment'));
    const frag = shader.substring(0, shader.indexOf('// Vertex')) + shader.substring(shader.indexOf('// Fragment'));

    return { shader, vert, frag };
};
