

// *******
// CLASSES
// *******


class Car {
    constructor(individual){
        this.individual = individual;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        this.speed = 0;
        this.steeringAngle = 0;
        this.mesh = new THREE.Group();
        scene.add(this.mesh);
        //this.geometry = new THREE.BoxGeometry(20, 10,10);
        this.material = new THREE.MeshToonMaterial({color: 0x00ff00, gradientMap: fiveTone });
        //this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.add(carMesh.clone());
        this.acceleration = false;
        this.deceleration = false;

        this.raycaster0 = new THREE.Raycaster(undefined, undefined, 0, 10);
    }
    spawn(){
        scene.add(this.mesh);
    }
    draw(){
        this.direction = new THREE.Vector3(1,0,0);
        this.direction.applyQuaternion(this.mesh.quaternion);   //make direction relative to rotation
        this.x += this.speed;
        this.mesh.position.add(this.direction.multiplyScalar(this.speed));
        this.mesh.rotation.z += this.speed * .025 * this.steeringAngle;
        if(this.acceleration && this.speed < 2){
            this.speed += .05;
        }else if(this.speed > 0){
            if (this.deceleration){
                this.speed -= .05;
            }
            this.speed -= .01;
        }else{
            this.speed = 0;
        }
        //animation
        this.mesh.children[0].rotation.x = Math.PI/2 + Math.sin(this.steeringAngle * this.speed * .1);

        //collision
        if(this.checkCollision()){
            this.mesh.position.set(0,0,0);
            this.mesh.rotation.z = 0;
        }
    }
    checkCollision(){
        this.raycaster0.set(this.mesh.position, new THREE.Vector3(1,0,0)
            .applyQuaternion(this.mesh.quaternion)
            .applyQuaternion(new THREE.Quaternion()
                .setFromAxisAngle(new THREE.Vector3(0,0,1), -Math.PI/8)));
        this.raycasterHelper = new THREE.ArrowHelper(this.raycaster0.ray.direction, this.raycaster0.ray.origin, 10, 0xff0000);
        this.raycasterHelper.position.z = 10;
        scene.add(this.raycasterHelper);
        /*let intersections = this.raycaster0.intersectObjects(scene.children, );
        if(intersections.length > 0){
            console.log(intersections[0].distance);
        }*/
        this.carBox = new THREE.Box3().setFromObject(this.mesh);
        for (const wall of w){
            if(this.carBox.intersectsBox(new THREE.Box3().setFromObject(wall.mesh))){
                return true;
            }
        }
        return false;
    }
    setColor(color){
        //this.mesh.children[0].children[0].children[3].material.color.set(color);
        //this.mesh.children[0].children[0].children[3].material = this.material;
        this.mesh.children[0].children[0].children[3].material = new THREE.MeshToonMaterial({color: color, gradientMap: fiveTone });
    }
}

class Wall {
    constructor(x1,y1,x2,y2){
        this.p1 = new THREE.Vector3(x1,y1,0);
        this.p2 = new THREE.Vector3(x2,y2,0);
        this.material = new THREE.MeshToonMaterial({color: 0x00ff00, gradientMap: fiveTone });
        this.geometry = new THREE.BoxGeometry(this.p1.distanceTo(this.p2), 10,10);
        this.mesh = new THREE.Mesh(this.geometry, this.material);
        this.mesh.position.set((x1+x2)/2,(y1+y2)/2,0);
        this.mesh.rotation.z = Math.atan2(y2-y1,x2-x1);
        scene.add(this.mesh);
    }
}


// *********
// FUNCTIONS
// *********


function setColors() {
    fetch('https://raw.githubusercontent.com/flug8/SimpleJS/master/colors.json')
        .then(response => response.json())
        .then(data => colors = data)
        .then(() => {
            plate.material.color.set(colors.c1);
        });
}

async function loadCarMesh(){
    let gltf = await gltfLoader.loadAsync('assets/glb/car.glb');
    gltf.scene.scale.set(5,5,5);
    gltf.scene.rotation.set(Math.PI/2,-Math.PI/2,0);
    carMesh = gltf.scene;
}

function loadCar(){
    c = new Car(0);
    c.spawn();
    let c2 = [];
    for(let i = 0; i < 100; i++) {
        c2[i] = new Car(i);
    }
    const walls = [
        [100, -100, 100, 100],
        [-100, -100, -100, 100],
        [-100, 100, 100, 100],
        [-100, -100, 100, -100]
    ];
    for(const wall of walls){
        w.push(new Wall(...wall));
    }

}

function keyDown(e){
    if(e.keyCode == 87){
        c.acceleration = true;
    }else if(e.keyCode == 83){
        c.deceleration = true;
    }else if(e.keyCode == 65){
        c.steeringAngle = 1;
    }else if(e.keyCode == 68){
        c.steeringAngle = -1;
    }
}

function keyUp(e){
    if(e.keyCode == 87){
        c.acceleration = false;
    }else if(e.keyCode == 83){
        c.deceleration = false;
    }else if(e.keyCode == 65 || e.keyCode == 68){
        c.steeringAngle = 0;
    }
}

// Animate
function animate(){
    renderer.render(scene, camera);
    c.draw();
    // cube.rotation.x += 0.01;
    // cube.rotation.y += 0.01;
    // cube.rotation.z += 0.01;
    requestAnimationFrame(animate);
}

// ****
// INIT
// ****


//LOADING

async function load() {
    let t = new Date();
    await setColors();
    await loadCarMesh();
    await loadCar();
    t = new Date() - t;
    console.log('loading time: ' + t + 'ms');
    await animate();
    return true;
}

// scene

const scene = new THREE.Scene();
const aspectRatio = window.innerWidth / window.innerHeight;
const sceneHeight = 200;
const sceneWidth = sceneHeight * aspectRatio;
const camera = new THREE.OrthographicCamera(-sceneWidth / 2, sceneWidth / 2, sceneHeight / 2, -sceneHeight / 2, 0, 200);
camera.position.set(0,-20,100);
camera.lookAt(0,0,0);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
const gltfLoader = new GLTFLoader();

// lights

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.set(-100, 100, 100);
scene.add(light);

const textureLoader = new THREE.TextureLoader();
const fiveTone = textureLoader.load('https://threejs.org/examples/textures/gradientMaps/fiveTone.jpg');
fiveTone.minFilter = THREE.NearestFilter;
fiveTone.magFilter = THREE.NearestFilter;

//background plate

const plate = new THREE.Mesh(new THREE.PlaneGeometry(window.innerWidth, window.innerHeight), new THREE.MeshToonMaterial({color: 0x00ff00, gradientMap: fiveTone }));
scene.add(plate);

// get Colors
let colors;

// load car
let carMesh;
let c;

let w = [];


// Dat gui

const gui = new dat.GUI();
const cameraFolder = gui.addFolder('Camera');
cameraFolder.add(camera.position, 'x', -100, 100);
cameraFolder.add(camera.position, 'y', -100, 100);
cameraFolder.add(camera.position, 'z', -100, 100);
cameraFolder.add(camera.rotation, 'x', -.5, .5);
cameraFolder.add(camera.rotation, 'y', -.5, .5);
cameraFolder.add(camera.rotation, 'z', -.5, .5);
cameraFolder.open();



setTimeout(load, 0);

// ***************
// EVENT LISTENERS
// ***************


window.addEventListener('keydown', keyDown, false);

window.addEventListener('keyup', keyUp, false);

