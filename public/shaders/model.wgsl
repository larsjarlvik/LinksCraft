struct Uniforms {
    modelMatrix: mat4x4f,
    viewMatrix: mat4x4f,
    projectionMatrix: mat4x4f,
}
@binding(0) @group(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
  @builtin(position) clip_pos: vec4f,
  @location(0) world_pos: vec3f,
  @location(1) normal: vec3f,
}

// Vertex
@vertex
fn main(
  @location(0) pos: vec3f,
  @location(1) normal: vec3f,
) -> VertexOutput {
    var output: VertexOutput;
    
    var world_position = uniforms.modelMatrix * vec4f(pos, 1.0);
    output.world_pos = world_position.xyz;
    output.clip_pos = uniforms.projectionMatrix * uniforms.viewMatrix * world_position;
    output.normal = normalize(mat3x3f(
        uniforms.modelMatrix[0].xyz, 
        uniforms.modelMatrix[1].xyz, 
        uniforms.modelMatrix[2].xyz
    ) * normal);

    return output;
}

// Fragment
@fragment
fn main(input: VertexOutput) -> @location(0) vec4f {
    let light_dir = normalize(vec3f(5.0, 5.0, 5.0));

    let diffuse_strength = max(dot(input.normal, light_dir), 0.0);
    let diffuse_color = vec3f(0.7) * diffuse_strength;
    let ambient_color = vec3f(0.3);

    return vec4f((ambient_color + diffuse_color) * vec3f(0.5), 1.0);
}
