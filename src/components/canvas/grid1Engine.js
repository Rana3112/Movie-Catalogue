import {
  Clock,
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  SRGBColorSpace,
  MathUtils,
  Vector2,
  Color,
  MeshPhysicalMaterial,
  ShaderChunk,
  InstancedMesh,
  Vector3,
  Object3D,
  FrontSide,
  PointLight,
  LatheGeometry,
  PCFSoftShadowMap,
  Raycaster,
  Plane,
} from 'three'

/**
 * ThreeApp - Lightweight Three.js lifecycle manager.
 * Handles resize, RAF loop, intersection observer, and cleanup.
 */
class ThreeApp {
  constructor(options = {}) {
    this.options = { ...options }
    this.canvas = this.options.canvas
    if (!this.canvas) {
      throw new Error('ThreeApp: Missing canvas element')
    }
    this.canvas.style.display = 'block'

    this.camera = new PerspectiveCamera()
    this.cameraFov = this.camera.fov
    this.cameraMinAspect = 0
    this.cameraMaxAspect = 5 / 3

    this.scene = new Scene()

    const rendererOptions = {
      canvas: this.canvas,
      powerPreference: 'high-performance',
      antialias: true,
      ...(this.options.rendererOptions || {}),
    }
    this.renderer = new WebGLRenderer(rendererOptions)
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = PCFSoftShadowMap

    this.size = { width: 0, height: 0, wWidth: 0, wHeight: 0, ratio: 0, pixelRatio: 0 }
    this.clock = new Clock()
    this.time = { elapsed: 0, delta: 0 }
    this.animId = null
    this.isDisposed = false
    this.isRunning = false

    this.onBeforeRender = () => {}
    this.onAfterRender = () => {}
    this.onAfterResize = () => {}

    this.resize()
    this.bindEvents()
  }

  resize() {
    let w, h
    if (this.options.size instanceof Object) {
      w = this.options.size.width
      h = this.options.size.height
    } else if (this.options.size === 'parent' && this.canvas.parentNode) {
      w = this.canvas.parentNode.offsetWidth || window.innerWidth
      h = this.canvas.parentNode.offsetHeight || window.innerHeight
    } else {
      w = window.innerWidth
      h = window.innerHeight
    }

    if (!w || w <= 0) w = window.innerWidth || 1920
    if (!h || h <= 0) h = window.innerHeight || 1080

    this.size.width = w
    this.size.height = h
    this.size.ratio = w / h

    this.updateCamera()
    this.updateRendererSize()
    this.onAfterResize(this.size)
  }

  updateCamera() {
    this.camera.aspect = this.size.width / this.size.height
    if (this.camera.isPerspectiveCamera && this.cameraFov) {
      if (this.cameraMinAspect && this.camera.aspect < this.cameraMinAspect) {
        this.clampFov(this.cameraMinAspect)
      } else if (this.cameraMaxAspect && this.camera.aspect > this.cameraMaxAspect) {
        this.clampFov(this.cameraMaxAspect)
      } else {
        this.camera.fov = this.cameraFov
      }
    }
    this.camera.updateProjectionMatrix()
    this.updateWorldSize()
  }

  clampFov(targetAspect) {
    const fovRad = MathUtils.degToRad(this.cameraFov / 2)
    const halfH = Math.tan(fovRad) / (this.camera.aspect / targetAspect)
    this.camera.fov = 2 * MathUtils.radToDeg(Math.atan(halfH))
  }

  updateWorldSize() {
    if (this.camera.isPerspectiveCamera) {
      const fovRad = (this.camera.fov * Math.PI) / 180
      this.size.wHeight = 2 * Math.tan(fovRad / 2) * this.camera.position.length()
      this.size.wWidth = this.size.wHeight * this.camera.aspect
    }
  }

  updateRendererSize() {
    this.renderer.setSize(this.size.width, this.size.height)
    const pr = Math.min(window.devicePixelRatio || 1, 2)
    this.renderer.setPixelRatio(pr)
    this.size.pixelRatio = pr
  }

  bindEvents() {
    this._onResize = () => {
      if (this._resizeTimeout) clearTimeout(this._resizeTimeout)
      this._resizeTimeout = setTimeout(() => this.resize(), 80)
    }
    window.addEventListener('resize', this._onResize)

    if (this.options.size === 'parent' && this.canvas.parentNode && typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(this._onResize)
      this.resizeObserver.observe(this.canvas.parentNode)
    }

    if (typeof IntersectionObserver !== 'undefined') {
      this.intersectionObserver = new IntersectionObserver(
        (entries) => {
          const isIntersecting = entries[0]?.isIntersecting
          if (isIntersecting) {
            this.start()
          } else {
            this.stop()
          }
        },
        { root: null, rootMargin: '0px', threshold: 0 }
      )
      this.intersectionObserver.observe(this.canvas)
    } else {
      this.start()
    }

    this._onVisibilityChange = () => {
      if (document.hidden) {
        this.stop()
      } else {
        this.start()
      }
    }
    document.addEventListener('visibilitychange', this._onVisibilityChange)
  }

  start() {
    if (this.isRunning || this.isDisposed) return
    this.isRunning = true
    this.clock.start()

    const loop = () => {
      if (!this.isRunning || this.isDisposed) return
      this.animId = requestAnimationFrame(loop)
      this.time.delta = this.clock.getDelta()
      this.time.elapsed += this.time.delta
      this.onBeforeRender(this.time)
      this.renderer.render(this.scene, this.camera)
      this.onAfterRender(this.time)
    }
    loop()
  }

  stop() {
    if (!this.isRunning) return
    this.isRunning = false
    if (this.animId) {
      cancelAnimationFrame(this.animId)
      this.animId = null
    }
    this.clock.stop()
  }

  dispose() {
    this.isDisposed = true
    this.stop()
    window.removeEventListener('resize', this._onResize)
    document.removeEventListener('visibilitychange', this._onVisibilityChange)
    if (this.resizeObserver) this.resizeObserver.disconnect()
    if (this.intersectionObserver) this.intersectionObserver.disconnect()
    if (this._resizeTimeout) clearTimeout(this._resizeTimeout)

    this.scene.traverse((obj) => {
      if (obj.isMesh) {
        if (obj.geometry) obj.geometry.dispose()
        if (obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m?.dispose?.())
          } else {
            obj.material?.dispose?.()
          }
        }
      }
    })
    this.scene.clear()
    this.renderer.dispose()
  }
}

/**
 * ScatteringMaterial - Physical material with custom subsurface scattering shader.
 */
class ScatteringMaterial extends MeshPhysicalMaterial {
  constructor(params = {}) {
    super(params)
    this.uniforms = {
      thicknessDistortion: { value: 0.1 },
      thicknessAmbient: { value: 0.0 },
      thicknessAttenuation: { value: 0.1 },
      thicknessPower: { value: 2.0 },
      thicknessScale: { value: 10.0 },
    }
    this.defines = this.defines || {}
    this.defines.USE_UV = ''

    this.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, this.uniforms)

      shader.fragmentShader =
        `
        uniform float thicknessPower;
        uniform float thicknessScale;
        uniform float thicknessDistortion;
        uniform float thicknessAmbient;
        uniform float thicknessAttenuation;
      ` + shader.fragmentShader

      shader.fragmentShader = shader.fragmentShader.replace(
        'void main() {',
        `
        void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
          vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
          float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
          vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * vColor;
          reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
        }

        void main() {
        `
      )

      const modifiedLights = ShaderChunk.lights_fragment_begin.replaceAll(
        'RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );',
        `
          RE_Direct( directLight, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, material, reflectedLight );
          RE_Direct_Scattering(directLight, vUv, geometryPosition, geometryNormal, geometryViewDir, geometryClearcoatNormal, reflectedLight);
        `
      )

      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <lights_fragment_begin>',
        modifiedLights
      )
    }
  }
}

/**
 * Creates lathe-generated hexagonal cylinder geometry with smooth beveled borders.
 */
function createLatheHexGeometry(segments, radius, height, bevelRadius, bevelHeight, bevelSegments = 6) {
  const points = []
  points.push(new Vector2(radius, -height / 2))
  for (let i = 0; i < bevelSegments; i++) {
    const px = radius - bevelRadius + Math.cos((i / (bevelSegments - 1)) * Math.PI * 0.5) * bevelRadius
    const py = height / 2 - bevelHeight + Math.sin((i / (bevelSegments - 1)) * Math.PI * 0.5) * bevelHeight
    points.push(new Vector2(px, py))
  }
  points.push(new Vector2(0, height / 2))

  const geom = new LatheGeometry(points, segments)
  geom.translate(0, -height / 2, 0)
  geom.rotateX(Math.PI / 2)
  return geom
}

/**
 * Creates color gradient generator for instance colors.
 */
function createColorGradient(colorList) {
  const parsed = colorList.map((c) => new Color(c))
  return {
    getColorAt(t, target = new Color()) {
      const clamped = Math.max(0, Math.min(1, t)) * (parsed.length - 1)
      const idx = Math.floor(clamped)
      const r1 = parsed[idx]
      if (idx >= parsed.length - 1) return r1.clone()
      const frac = clamped - idx
      const r2 = parsed[idx + 1]
      target.r = r1.r + frac * (r2.r - r1.r)
      target.g = r1.g + frac * (r2.g - r1.g)
      target.b = r1.b + frac * (r2.b - r1.b)
      return target
    },
  }
}

const DEFAULT_CONFIG = {
  type: 'circle',
  n: 20,
  light1Color: 0xffffff,
  light1Intensity: 10000,
  light1PositionZ: 50,
  light2Color: 0xff1122,
  light2Intensity: 15000,
  light2PositionZ: -20,
  colors: [0x222222, 0x222222],
  materialParams: {
    metalness: 0.5,
    roughness: 0.5,
    clearcoat: 1.0,
    clearcoatRoughness: 0.2,
  },
  timeCoef: 1.0,
  depthScale: 3.0,
  tiltRotationX: 0.15,
  tiltRotationY: 0.15,
}

/**
 * HexLatheGrid - Instanced 3D hexagonal mesh with subsurface lighting.
 */
class HexLatheGrid extends InstancedMesh {
  constructor(app, userConfig = {}) {
    const config = { ...DEFAULT_CONFIG, ...userConfig }

    const segments = 6
    const radius = 50 / config.n
    config.radius = radius
    config.width = 2 * radius
    config.height = 2 * Math.tan(Math.PI / 3) * radius
    config.nx = config.n
    config.ny = config.n

    const geom = createLatheHexGeometry(
      segments,
      radius,
      5 * radius,
      0.125 * radius,
      0.125 * radius
    )

    const mat = new ScatteringMaterial({
      ...config.materialParams,
      side: FrontSide,
    })

    const count = config.nx * config.ny
    super(geom, mat, count)

    this.app = app
    this.config = config
    this.count = count

    this.pointerPosition = new Vector3()
    this.tilt = new Vector3()
    this.tiltSmoothed = new Vector3()
    this.tempVec2 = new Vector2()
    this.timeAccum = 0

    // Compute hexagonal grid matrix positions
    const spacingX = Math.cos(Math.PI / 6) * radius * 2
    const spacingY = 1.5 * radius
    const startX = (-config.nx / 2) * spacingX + spacingX / 4
    const startY = (-config.ny / 2) * spacingY + spacingY / 2

    this.positions = new Array(count)
    for (let x = 0; x < config.nx; x++) {
      for (let y = 0; y < config.ny; y++) {
        this.positions[x * config.ny + y] = {
          x: startX + x * spacingX + ((y % 2) / 2) * spacingX,
          y: startY + y * spacingY,
          rotZ: 0,
        }
      }
    }

    // Per-tile phase offset for smooth wave ripples
    this.phaseOffsets = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      this.phaseOffsets[i] = MathUtils.randFloatSpread(2 * Math.PI)
    }

    // Set up lights
    this.setupLights()

    this.castShadow = true
    this.receiveShadow = true
    this.setColors(config.colors)
  }

  setupLights() {
    const l1 = new PointLight(this.config.light1Color, this.config.light1Intensity)
    l1.position.z = this.config.light1PositionZ
    l1.castShadow = true
    l1.shadow.mapSize.width = 1024
    l1.shadow.mapSize.height = 1024
    this.light1 = l1
    this.app.scene.add(this.light1)

    const l2 = new PointLight(this.config.light2Color, this.config.light2Intensity)
    l2.position.z = this.config.light2PositionZ
    this.light2 = l2
    this.app.scene.add(this.light2)
  }

  setColors(colorList) {
    if (Array.isArray(colorList) && colorList.length > 0) {
      const gradient = createColorGradient(colorList.length === 1 ? [colorList[0], colorList[0]] : colorList)
      for (let i = 0; i < this.count; i++) {
        this.setColorAt(i, gradient.getColorAt(Math.random()))
      }
      if (this.instanceColor) this.instanceColor.needsUpdate = true
    }
  }

  resize() {
    if (this.app.size.ratio > 1) {
      this.scale.x = (this.app.size.wWidth / 100) * 1.4
      this.scale.y = this.scale.x
    } else {
      this.scale.y = (this.app.size.wHeight / 100) * 1.4
      this.scale.x = this.scale.y
    }
  }

  update(time) {
    this.timeAccum += time.delta * this.config.timeCoef
    this.light1.position.set(this.pointerPosition.x, this.pointerPosition.y, this.config.light1PositionZ)
    this.light2.position.set(this.pointerPosition.x, this.pointerPosition.y, this.config.light2PositionZ)
    this.tiltSmoothed.lerp(this.tilt, 0.1)
    this.rotation.set(
      this.tiltSmoothed.x * this.config.tiltRotationX,
      this.tiltSmoothed.y * this.config.tiltRotationY,
      0
    )

    const dummy = new Object3D()
    const radiusLimit = 20 * this.config.radius

    for (let x = 0; x < this.config.nx; x++) {
      for (let y = 0; y < this.config.ny; y++) {
        const i = x * this.config.ny + y
        const pos = this.positions[i]
        const dist = this.tempVec2
          .set(pos.x, pos.y)
          .multiplyScalar(this.scale.x)
          .sub(this.pointerPosition)
          .length()
        const factor = 1 - MathUtils.smoothstep(dist, 0, radiusLimit)

        dummy.position.x = pos.x
        dummy.position.y = pos.y
        dummy.position.z =
          0.5 * (Math.cos(this.phaseOffsets[i] + this.timeAccum) - 1) * this.config.radius * this.config.depthScale * factor
        dummy.rotation.z = pos.rotZ
        dummy.updateMatrix()
        this.setMatrixAt(i, dummy.matrix)
      }
    }
    this.instanceMatrix.needsUpdate = true
  }
}

/**
 * Attaches pointer tracking across entire screen.
 */
function attachPointerTracker(domElement, handlers = {}) {
  const tracker = {
    domElement,
    position: new Vector2(),
    nPosition: new Vector2(),
    hover: false,
    onMove: handlers.onMove || (() => {}),
    onLeave: handlers.onLeave || (() => {}),
  }

  const onPointerMove = (e) => {
    const rect = domElement.getBoundingClientRect()
    if (
      rect.width > 0 &&
      rect.height > 0 &&
      e.clientX >= rect.left &&
      e.clientX <= rect.left + rect.width &&
      e.clientY >= rect.top &&
      e.clientY <= rect.top + rect.height
    ) {
      tracker.position.x = e.clientX - rect.left
      tracker.position.y = e.clientY - rect.top
      tracker.nPosition.x = (tracker.position.x / rect.width) * 2 - 1
      tracker.nPosition.y = -(tracker.position.y / rect.height) * 2 + 1
      tracker.hover = true
      tracker.onMove(tracker)
    } else if (tracker.hover) {
      tracker.hover = false
      tracker.onLeave(tracker)
    }
  }

  const onPointerLeave = () => {
    if (tracker.hover) {
      tracker.hover = false
      tracker.onLeave(tracker)
    }
  }

  window.addEventListener('pointermove', onPointerMove, { passive: true })
  document.body.addEventListener('pointerleave', onPointerLeave, { passive: true })

  return {
    dispose() {
      window.removeEventListener('pointermove', onPointerMove)
      document.body.removeEventListener('pointerleave', onPointerLeave)
    },
  }
}

/**
 * Grid1Background - Public entry point matching threejs-components specification.
 */
export function Grid1Background(canvas, options = {}) {
  const app = new ThreeApp({
    canvas,
    size: 'parent',
    rendererOptions: { antialias: true },
  })

  app.cameraMaxAspect = 5 / 3
  app.camera.position.z = 100
  app.updateWorldSize()

  const grid = new HexLatheGrid(app, options)
  app.scene.add(grid)
  grid.resize()

  const raycaster = new Raycaster()
  const plane = new Plane(new Vector3(0, 0, 1), 0)
  const intersectPoint = new Vector3()

  const pointerTracker = attachPointerTracker(canvas, {
    onMove(p) {
      raycaster.setFromCamera(p.nPosition, app.camera)
      app.camera.getWorldDirection(plane.normal)
      raycaster.ray.intersectPlane(plane, intersectPoint)
      grid.tilt.set(-p.nPosition.y, p.nPosition.x, 0)
    },
    onLeave() {
      intersectPoint.set(0, 0, 0)
      grid.tilt.set(0, 0, 0)
    },
  })

  app.onBeforeRender = (time) => {
    grid.pointerPosition.lerp(intersectPoint, 0.1)
    grid.update(time)
  }

  app.onAfterResize = () => {
    grid.resize()
  }

  return {
    three: app,
    grid,
    light1: grid.light1,
    light2: grid.light2,
    dispose() {
      pointerTracker.dispose()
      app.dispose()
    },
  }
}
