import { GltfLoader } from 'gltf-loader-ts';

export const load = async (name) => {
    const loader = new GltfLoader();
    const uri = `/models/${name}.glb`;
    return await loader.load(uri);
};
