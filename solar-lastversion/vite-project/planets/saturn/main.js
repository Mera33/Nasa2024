import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// إنشاء المشهد والكاميرا
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    35,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// وضع الكاميرا بحيث تكون قريبة من خط الأفق
camera.position.set(0, 20, 100);

// إعداد Renderer
const canvas = document.querySelector('canvas.threejs');
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
});

renderer.setSize(window.innerWidth, window.innerHeight);

// تحديث العرض عند تغيير حجم نافذة المتصفح
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// الأرض

// إنشاء الـ TextureLoader
const textureLoader = new THREE.TextureLoader();
const texture = textureLoader.load(
    'textures/saturn.jpg', // استخدم المسار النسبي
    () => {
        console.log('Texture loaded successfully');
    },
    undefined,
    (error) => {
        console.error('An error occurred while loading the texture:', error);
    }
);

// إنشاء الأرضية
const planeGeometry = new THREE.PlaneGeometry(400, 400);
const planeMaterial = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide });
const plane = new THREE.Mesh(planeGeometry, planeMaterial);
plane.rotation.x = -Math.PI / 2;
plane.position.y = 0;
scene.add(plane);

// إعداد عناصر التحكم
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableZoom = true;
controls.enablePan = true;
controls.maxPolarAngle = Math.PI / 2; // السماح بالنظر للأعلى

// متغير لتخزين النجمة المختارة سابقًا ولونها الأصلي
let previousStar = null;
let previousStarColor = null;

// دالة لإضافة قبة النجوم
async function createStarDome() {
    try {
        // تحميل بيانات النجوم من ملف stars_json.json
        const response = await fetch('./stars_json.json'); // استخدم المسار النسبي
        const starsData = await response.json();

        // إنشاء مجموعة النجوم على شكل قبة حول المشهد
        const starDomeGroup = new THREE.Group();
        starDomeGroup.name = 'starDome';

        // إضافة النجوم إلى القبة السماوية
        starsData.forEach(star => {
            const starPosition = new THREE.Vector3(star.x, star.y, star.z);
            const skyDistance = 500;

            // تكبير النسبة بحيث تشكل النجوم قبة سماوية كبيرة ثابتة في السماء
            const starSkyPosition = starPosition.normalize().multiplyScalar(skyDistance);

            // إنشاء خامة النجم
            const starMaterial = new THREE.MeshBasicMaterial({ color: star._3d.color });
            const starGeometry = new THREE.SphereGeometry(1.0, 16, 16); // تكبير حجم النجم قليلاً لتسهيل الكشف

            // إنشاء شبكة النجم وإضافتها إلى المجموعة
            const starMesh = new THREE.Mesh(starGeometry, starMaterial);
            starMesh.position.set(starSkyPosition.x, starSkyPosition.y, starSkyPosition.z);

            starMesh.userData.id = star.id;
            starMesh.userData.isStar = true; // تحديد أن هذا العنصر هو نجم
            starDomeGroup.add(starMesh);
        });

        // إضافة مجموعة النجوم إلى المشهد
        scene.add(starDomeGroup);

    } catch (error) {
        console.error("Error loading stars:", error);
    }
}

// إنشاء القبة السماوية للنجوم
createStarDome();

// حدث للنقر على النجوم لعرض الـ ID ورسم الخط
renderer.domElement.addEventListener('pointerdown', (event) => {
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.params.Points = { threshold: 1 };
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        if (selectedObject.userData.isStar) {
            // إذا كانت هناك نجمة مختارة سابقًا، قم برسم خط بينها وبين النجمة الحالية
            if (previousStar) {
                drawLineBetweenStars(previousStar, selectedObject);
                // إعادة تعيين لون النجمة السابقة إلى لونها الأصلي
                previousStar.material.color.set(previousStarColor);
            }

            // تخزين النجمة الحالية ولونها الأصلي
            previousStar = selectedObject;
            previousStarColor = selectedObject.material.color.clone();

            // تمييز النجمة بلون مختلف عند تحديدها
            selectedObject.material.color.set(0x00ff00);
        }
    }
});

// دالة لرسم خط بين نجمتين
function drawLineBetweenStars(star1, star2) {
    const points = [star1.position.clone(), star2.position.clone()];
    const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0xff0000, linewidth: 2 });
    const line = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(line);
}

// دالة التحريك
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

animate();
