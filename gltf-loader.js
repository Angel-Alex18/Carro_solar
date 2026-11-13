import { SceneLoader, TransformNode } from "@babylonjs/core";
import "@babylonjs/loaders";

/**
 * Gestor de Carga GLTF con Fallback Procedural
 * Permite cargar archivos .gltf/.glb locales si existen; de lo contrario,
 * recurre transparentemente al generador procedural de Babylon.js.
 */
export async function loadGltfOrFallback(scene, modelPath, fallbackBuilder, parentNode = null) {
  if (!modelPath) {
    return fallbackBuilder(scene, parentNode);
  }

  try {
    const result = await SceneLoader.ImportMeshAsync("", "", modelPath, scene);
    if (result && result.meshes && result.meshes.length > 0) {
      const rootNode = new TransformNode("gltf_root_" + (modelPath.split('/').pop()), scene);
      result.meshes.forEach(mesh => {
        if (!mesh.parent) {
          mesh.parent = rootNode;
        }
      });
      if (parentNode) {
        rootNode.parent = parentNode;
      }
      return rootNode;
    }
  } catch (err) {
    console.warn(`[GLTF Loader] No se pudo cargar el asset ${modelPath}. Usando modelado procedural local.`, err.message);
  }

  return fallbackBuilder(scene, parentNode);
}
