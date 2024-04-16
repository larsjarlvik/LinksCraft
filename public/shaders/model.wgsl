struct Uniforms {
    modelMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
}
@binding(0) @group(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) normal: vec3f,
}

// Vertex
@vertex
fn main(
  @location(0) pos: vec3f,
  @location(1) normal: vec3f,
) -> VertexOutput {
    var output: VertexOutput;
    output.pos = uniforms.projectionMatrix * uniforms.viewMatrix * uniforms.modelMatrix * vec4f(pos, 1.0);
    output.normal = normal;
    return output;
}

// Fragment
@fragment
fn main(input: VertexOutput) -> @location(0) vec4f {
    let normal = normalize(input.normal);
    let light = dot(normal, -vec3f(0.5, -0.5, -0.5));
    let color = vec3f(1.0, 0.0, 0.0) * light;

    return vec4f(color, 1.0);
}
