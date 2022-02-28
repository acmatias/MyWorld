import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader'
import * as dat from 'lil-gui'
import * as CANNON from 'cannon-es'

let raycaster

let moveForward = false
let moveBackward = false
let moveLeft = false
let moveRight = false
let canJump = false

let prevTime = performance.now()
const velocity = new THREE.Vector3()
const direction = new THREE.Vector3()
const vertex = new THREE.Vector3()
const color = new THREE.Color()

/**
 * Debug
 */
const gui = new dat.GUI()

// const debugObject = {}
// debugObject.createSphere = () => {
//     createSphere(Math.random() * 0.5, {
//         x: (Math.random() - 0.5) * 3,
//         y: 3,
//         z: (Math.random() - 0.5) * 3,
//     })
// }
// debugObject.createBox = () => {
//     createBox(Math.random(), Math.random(), Math.random(), {
//         x: (Math.random() - 0.5) * 3,
//         y: 3,
//         z: (Math.random() - 0.5) * 3,
//     })
// }
// debugObject.reset = () => {
//     for (const object of objectsToUpdate) {
//         // Remove body
//         object.body.removeEventListener('collide', playHitSounds)
//         world.removeBody(object.body)

//         // Remove mesh
//         scene.remove(object.mesh)
//     }
// }
// gui.add(debugObject, 'createSphere')
// gui.add(debugObject, 'createBox')
// gui.add(debugObject, 'reset')

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()
scene.background = new THREE.Color('#000000')
scene.fog = new THREE.Fog('#ffffff', 0, 535)

gui.add(scene.fog, 'far').min(100).max(1000).step(1).name('fog')

/**
 * Sounds
 */
// const hitSounds = new Audio('/sounds/hit.mp3')

// const playHitSounds = (collision) => {
//     const impactStrength = collision.contact.getImpactVelocityAlongNormal()

//     if (impactStrength > 1.5) {
//         hitSounds.volume = Math.random()
//         hitSounds.currentTime = 0
//         hitSounds.play()
//     }
// }

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()
const dracoLoader = new DRACOLoader()
dracoLoader.setDecoderPath('/draco/')

const gltfLoader = new GLTFLoader()
gltfLoader.setDRACOLoader(dracoLoader)
const cubeTextureLoader = new THREE.CubeTextureLoader()

const environmentMapTexture = cubeTextureLoader.load([
    '/textures/environmentMaps/0/px.png',
    '/textures/environmentMaps/0/nx.png',
    '/textures/environmentMaps/0/py.png',
    '/textures/environmentMaps/0/ny.png',
    '/textures/environmentMaps/0/pz.png',
    '/textures/environmentMaps/0/nz.png',
])

/**
 * Physics
 */
// // World
const world = new CANNON.World()
// world.broadphase = new CANNON.SAPBroadphase(world)
// world.allowSleep = true
// world.gravity.set(0, -9.32, 0)

// // Materials
// const defaultMaterial = new CANNON.Material('default')
// // const plasticMaterial = new CANNON.Material('plastic')

// const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, {
//     friction: 0.1,
//     restitution: 0.7,
// })
// world.addContactMaterial(defaultContactMaterial)
// world.defaultContactMaterial = defaultContactMaterial

// Floor
const floorShape = new CANNON.Plane()
const floorBody = new CANNON.Body()
floorBody.mass = 0
floorBody.addShape(floorShape)
floorBody.quaternion.setFromAxisAngle(new CANNON.Vec3(-1, 0, 0), Math.PI * 0.5)

world.addBody(floorBody)

/**
 * Floor
 */

// const floor = new THREE.Mesh(
//     new THREE.PlaneGeometry(2000, 2000, 100, 100),
//     new THREE.MeshStandardMaterial({
//         color: '#777777',
//         metalness: 0.3,
//         roughness: 0.4,
//         envMap: environmentMapTexture,
//         envMapIntensity: 0.5,
//     })
// )
// floor.receiveShadow = true
// floor.rotation.x = -Math.PI * 0.5
// scene.add(floor)

// Floor 2
let floorGeometry = new THREE.PlaneGeometry(2000, 2000, 100, 100)
floorGeometry.rotateX(-Math.PI / 2)

// vertex displacement

let position = floorGeometry.attributes.position

for (let i = 0, l = position.count; i < l; i++) {
    vertex.fromBufferAttribute(position, i)

    vertex.x += Math.random() * 20 - 10
    vertex.y += Math.random() * 2
    vertex.z += Math.random() * 20 - 10

    position.setXYZ(i, vertex.x, vertex.y, vertex.z)
}

floorGeometry = floorGeometry.toNonIndexed() // ensure each face has unique vertices

position = floorGeometry.attributes.position
const colorsFloor = []

for (let i = 0, l = position.count; i < l; i++) {
    color.setHSL(Math.random() * 0.3 + 0.5, 0.75, Math.random() * 0.25 + 0.75)
    colorsFloor.push(color.r, color.g, color.b)
}

floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsFloor, 3))

const floorMaterial = new THREE.MeshBasicMaterial({ vertexColors: true })

const floor = new THREE.Mesh(floorGeometry, floorMaterial)
scene.add(floor)

// Models
gltfLoader.load('/models/DungeonModel.glb', (gltf) => {
    gltf.scene.scale.set(1.5, 1.5, 1.5)
    gltf.scene.position.set(-3.5, -2, -25)
    // scene.add(gltf.scene)
    // updateAllMaterials()
})
gltfLoader.load('/models/JapaneseHouseModel.glb', (gltf) => {
    // gltf.scene.scale.set(0.5, 0.5, 0.5)
    gltf.scene.position.set(-60, 3.3, -100)
    gltf.scene.rotation.y = -0.6
    scene.add(gltf.scene)
    // updateAllMaterials()
})

// -----------------------------------------------------------------------------------------------------

/**
 * Lights
 */

const light = new THREE.HemisphereLight(0xeeeeff, 0x777788, 1.5)
light.position.set(0.5, 1, 0.75)
scene.add(light)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
}

window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 500)
camera.position.set(0, 10, 0)
scene.add(camera)

// Controls
const controls = new PointerLockControls(camera, canvas)

const blocker = document.getElementById('blocker')
const instructions = document.getElementById('instructions')

instructions.addEventListener('click', function () {
    controls.lock()
})

controls.addEventListener('lock', function () {
    instructions.style.display = 'none'
    blocker.style.display = 'none'
})

controls.addEventListener('unlock', function () {
    blocker.style.display = 'block'
    instructions.style.display = ''
})

scene.add(controls.getObject())

const onKeyDown = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true
            break

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true
            break

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true
            break

        case 'ArrowRight':
        case 'KeyD':
            moveRight = true
            break

        case 'Space':
            if (canJump === true) velocity.y += 300
            canJump = false
            break
    }
}

const onKeyUp = function (event) {
    switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false
            break

        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false
            break

        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false
            break

        case 'ArrowRight':
        case 'KeyD':
            moveRight = false
            break
    }
}

document.addEventListener('keydown', onKeyDown)
document.addEventListener('keyup', onKeyUp)

raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10)

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
})
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Animate
 */
const clock = new THREE.Clock()
let oldElapsedTime = 0

const tick = () => {
    const elapsedTime = clock.getElapsedTime()
    const deltaTime = elapsedTime - oldElapsedTime
    oldElapsedTime = elapsedTime

    const time = performance.now()

    // Update controls
    if (controls.isLocked === true) {
        raycaster.ray.origin.copy(controls.getObject().position)
        raycaster.ray.origin.y -= 10

        // const intersections = raycaster.intersectObjects(objects, false)

        // const onObject = intersections.length > 0

        const delta = (time - prevTime) / 1000

        velocity.x -= velocity.x * 10.0 * delta
        velocity.z -= velocity.z * 10.0 * delta

        velocity.y -= 9.8 * 100.0 * delta // 100.0 = mass

        direction.z = Number(moveForward) - Number(moveBackward)
        direction.x = Number(moveRight) - Number(moveLeft)
        direction.normalize() // this ensures consistent movements in all directions

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta

        // if (onObject === true) {
        //     velocity.y = Math.max(0, velocity.y)
        //     canJump = true
        // }

        controls.moveRight(-velocity.x * delta)
        controls.moveForward(-velocity.z * delta)

        controls.getObject().position.y += velocity.y * delta // new behavior

        if (controls.getObject().position.y < 10) {
            velocity.y = 0
            controls.getObject().position.y = 10

            canJump = true
        }
    }
    prevTime = time

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
