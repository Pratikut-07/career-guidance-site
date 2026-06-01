from flask import Flask, Blueprint, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import openai
import os
from dotenv import load_dotenv
import datetime
from sqlalchemy.ext.mutable import MutableDict
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
# setup
load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")

# Configure OpenAI
openai.api_key = OPENAI_API_KEY

# Initialize Flask app
app = Flask(__name__)
CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:5173"}})

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///career_guidance.db'
app.config['JWT_SECRET_KEY'] = JWT_SECRET_KEY
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False  

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# User model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(120), nullable=False)
    profile_data = db.Column(MutableDict.as_mutable(db.JSON),default=dict)

# Create blueprints
auth_bp = Blueprint('auth', __name__, url_prefix='/auth')
purpose = Blueprint("purpose",__name__,url_prefix="/purpose")
roadmap = Blueprint("roadmap",__name__,url_prefix="/roadmap")



# Authentication routes
@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['username', 'email', 'password']):
        return jsonify({"error": "Missing required fields"}), 400
        
    # Check if user already exists
    if User.query.filter_by(username=data['username']).first():
        return jsonify({"error": "Username already exists"}), 409
    if User.query.filter_by(email=data['email']).first():
        return jsonify({"error": "Email already exists"}), 409
    
    # Create new user
    new_user = User(
        username=data['username'],
        email=data['email'],
        password_hash=generate_password_hash(data['password'])
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({"message": "User registered successfully"}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500



@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    
    # Validate required fields
    if not all(k in data for k in ['username', 'password']):
        return jsonify({"error": "Missing username or password"}), 400
    
    # Find user
    user = User.query.filter_by(username=data['username']).first()
    
    # Verify password
    if user and check_password_hash(user.password_hash, data['password']):
        access_token = create_access_token(identity=str(user.id))
        return jsonify({
            "token": access_token,
            "user_id": user.id,
            "username": user.username
        }), 200
    
    return jsonify({"error": "Invalid username or password"}), 401

    # In-memory OTP store: {email: {"otp": ..., "expires_at": ...}}
otp_store = {}

def send_otp_email(to_email, otp):
        # Configure your SMTP server and sender email
        smtp_server = "smtp.gmail.com"
        smtp_port = 587
        sender_email = os.getenv("SENDER_EMAIL")  # Set this in your .env
        sender_password = os.getenv("SENDER_EMAIL_PASSWORD")  # Set this in your .env

        subject = "Career Guidance App - Password Reset OTP"
        body = f"Your OTP for password reset is: {otp}\nThis OTP is valid for 10 minutes."

        msg = MIMEMultipart()
        msg["From"] = sender_email
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "plain"))

        try:
            server = smtplib.SMTP(smtp_server, smtp_port)
            server.starttls()
            server.login(sender_email, sender_password)
            server.sendmail(sender_email, to_email, msg.as_string())
            server.quit()
            return True
        except Exception as e:
            print(f"Error sending OTP email: {str(e)}")
            return False

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
        data = request.get_json()
        email = data.get('email')
        if not email:
            return jsonify({"error": "Email is required"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "No user found with this email"}), 404

        otp = random.randint(100000, 999999)
        expires_at = datetime.datetime.now() + datetime.timedelta(minutes=10)
        otp_store[email] = {"otp": str(otp), "expires_at": expires_at}

        if send_otp_email(email, otp):
            return jsonify({"message": "OTP sent to your email"}), 200
        else:
            return jsonify({"error": "Failed to send OTP email"}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
        data = request.get_json()
        email = data.get('email')
        otp = data.get('otp')
        new_password = data.get('new_password')

        if not all([email, otp, new_password]):
            return jsonify({"error": "Email, OTP, and new password are required"}), 400

        otp_entry = otp_store.get(email)
        if not otp_entry:
            return jsonify({"error": "OTP not requested or expired"}), 400

        if datetime.datetime.now() > otp_entry["expires_at"]:
            otp_store.pop(email, None)
            return jsonify({"error": "OTP expired"}), 400

        if otp_entry["otp"] != str(otp):
            return jsonify({"error": "Invalid OTP"}), 400

        user = User.query.filter_by(email=email).first()
        if not user:
            return jsonify({"error": "No user found with this email"}), 404
        

        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        otp_store.pop(email, None)
        return jsonify({"message": "Password reset successful"}), 200

@auth_bp.route('/profile', methods=['GET', 'PUT'])
@jwt_required()
def profile():
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if request.method == 'GET':
        return jsonify({
            "username": user.username,
            "email": user.email,
            "profile_data": user.profile_data
        })
    
    # Update profile
    if request.method == 'PUT':
        data = request.get_json()
        
        # Update profile data
        if 'profile_data' in data:
            user.profile_data = data['profile_data']
        
        try:
            db.session.commit()
            return jsonify({"message": "Profile updated successfully"})
        except Exception as e:
            db.session.rollback()
            return jsonify({"error": str(e)}), 500



# Create database tables
with app.app_context():
    db.create_all()


# Register blueprints
app.register_blueprint(auth_bp)
app.register_blueprint(purpose)
app.register_blueprint(roadmap)


# home page
@app.route("/")
def home():
    return {"message": "Welcome to the Career Guidance APP"}

# Career categories with descriptions and video links
INDIA_CAREER_CATEGORIES = {
    "govt_jobs": {
        "title": "Government Jobs",
        "description": "Stable career opportunities in various government sectors",
        "video_url": "https://www.yout-ube.com/watch?v=JGLzgNfwahc"
    },
    "engineering_tech": {
        "title": "Engineering & Technology",
        "description": "Career in innovation, development, and technical problem-solving",
        "video_url": "https://www.yout-ube.com/watch?v=xrcOtQVtaUA"
    },
    "medical_healthcare": {
        "title": "Medical & Healthcare",
        "description": "Careers dedicated to health, medicine, and patient care",
        "video_url": "https://www.yout-ube.com/watch?v=_k7hxkGtu6I"
    },
    "business_entrepreneurship": {
        "title": "Business & Entrepreneurship",
        "description": "Opportunities in business management, startups, and entrepreneurship",
        "video_url": "https://www.yout-ube.com/watch?v=aozlwC3XwfY"
    },
    "arts_creative": {
        "title": "Arts, Crafts, & Creative",
        "description": "Careers in fine arts, design, crafts, and creative industries",
        "video_url": "https://www.yout-ube.com/watch?v=CBq73yxha0o"
    },
    "commerce_finance": {
        "title": "Commerce & Finance",
        "description": "Opportunities in accounting, finance, banking, and commerce",
        "video_url": "https://www.yout-ube.com/watch?v=N_qN7ns_5LE&t=14s"
    },
    "education_teaching": {
        "title": "Education & Teaching",
        "description": "Careers in teaching, training, and educational administration",
        "video_url": "https://www.yout-ube.com/watch?v=KVLTxKyxioA"
    },
    "law_legal": {
        "title": "Law & Legal Services",
        "description": "Opportunities in law, legal practice, and judiciary services",
        "video_url": "https://www.yout-ube.com/watch?v=JGLzgNfwahc"
    },
    "mass_media_communication": {
        "title": "Mass Media & Communication",
        "description": "Careers in journalism, media, public relations, and communication",
        "video_url": "https://www.yout-ube.com/watch?v=BG1-Q96moZI"
    },
    "sports_fitness": {
        "title": "Sports & Physical Fitness",
        "description": "Opportunities in sports, fitness training, and physical education",
        "video_url": "https://www.yout-ube.com/watch?v=LnhuhEZofwI"
    },
    "hospitality_tourism": {
        "title": "Hospitality & Tourism",
        "description": "Careers in hotel management, travel, and tourism industry",
        "video_url": "https://www.yout-ube.com/watch?v=0POQpL8DjuY"
    },
    "science_research": {
        "title": "Science & Research",
        "description": "Opportunities in scientific research, innovation, and academia",
        "video_url": "https://www.yout-ube.com/watch?v=LhU9PduyZAU"
    }
}

# Remove certain categories for international careers
INTERNATIONAL_CAREER_CATEGORIES = {k: v for k, v in INDIA_CAREER_CATEGORIES.items() 
                                 if k not in ["govt_jobs", "law_legal"]}

def generate_questions_for_school_student():
    # OpenAI version
    
    prompt = """Generate 5 simple career guidance questions for school students. 
    Questions should be short (1-2 lines) and use simple and age-appropriate language. 
    Cover topics such as: current grade or standard, favorite subjects and why, hobbies and free time activities, personality traits, values and beliefs, academic achievements or certifications, future goals, learning style preferences, extra-curricular activities, and subject-specific interests.
      The questions should help in identifying the student's career interests and aspirations."""
    
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": prompt}
        ],
         temperature=0.7,
            max_tokens=300
    )
    return response.choices[0].message.content
    
    

def generate_questions_for_higher_education():
    # OpenAI version
    
    prompt = """Generate 5 clear and specific career guidance questions for a college/university student or recent graduate. Keep questions short (1-2 lines).
      Focus on areas such as: skills and technical competencies, personality type and work preferences, values and career aspirations, education and qualifications, professional experiences or internships, industry preferences, and specific career goals. 
    The questions should be practical and directly help in identifying suitable career paths within the student's chosen field."""
    
    response = openai.chat.completions.create(
        model="gpt-3.5-turbo",
        messages=[
            {"role": "user", "content": prompt}
        ],
         temperature=0.7,
            max_tokens=300
    )
    return response.choices[0].message.content
    
    

@app.route("/purpose/location", methods=['GET'])
def get_location_choice():
    return jsonify({
        "message": "Choose your preferred career location",
        "options": ["India", "International"]
    })

@app.route("/purpose/categories", methods=['GET'])
def get_career_categories():
    location = request.args.get('location', 'India')
    categories = INDIA_CAREER_CATEGORIES if location == 'India' else INTERNATIONAL_CAREER_CATEGORIES
    return jsonify(categories)

@app.route("/purpose/education-level", methods=['GET'])
def get_education_level():
    return jsonify({
        "message": "What is your current educational status?",
        "options": [
            "School Student",
            "College Student",
            "University Student",
            "Graduated"
        ]
    })

@app.route("/purpose/questions", methods=['GET'])
def get_questions():
    education_level = request.args.get('level')
    try:
        if not OPENAI_API_KEY:
            return jsonify({"error": "OpenAI API key is not configured"}), 500
            
        if education_level == "School Student":
            questions = generate_questions_for_school_student()
        else:
            questions = generate_questions_for_higher_education()
            
        return jsonify({"questions": questions})
    except Exception as e:
        print(f"Error generating questions: {str(e)}")  # Debug logging
        return jsonify({"error": f"Failed to generate questions: {str(e)}"}), 500
    




@app.route("/purpose/recommend", methods=['POST','GET'])
@jwt_required()
def recommend_careers():
    data = request.get_json()
    required_fields = ['location', 'educationLevel', 'selectedCategory', 'answers']
    for field in required_fields:
        if field not in data:
            return jsonify({"error": f"Missing field: {field}"}), 422

    
    # Generate personalized career recommendations
    try:
        if not OPENAI_API_KEY:
            return jsonify({"error": "OpenAI API key is not configured"}), 500

        # Create a detailed prompt based on user data
        user_profile = f"""
        Location: {data['location']}
        Education Level: {data['educationLevel']}
        Career Category Interest: {data['selectedCategory']}
        
        User's Answers to Assessment Questions:
        {chr(10).join(f"- {answer}" for answer in data['answers'])}
        """

        prompt = f"""Based on the following user profile, suggest 3 specific careers with detailed descriptions and match percentages:
        {user_profile}
        
        Consider the user's location, education level, interests, and answers to provide personalized career recommendations.
        Format each career recommendation with(with only these 4 things mentioned below):
        1. Job title(do not index)
        2. Detailed description of the role and required skills
        3. match percentage (85-100)
        4. Whether a detailed career roadmap is available (set to true)
        
        Ensure suggestions are specific to their chosen category and realistic for their education level."""

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a career guidance expert providing detailed career recommendations."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=300
        )

        # Parse the AI response and structure it
        ai_suggestions = response.choices[0].message.content
        
        # Convert AI response into structured career recommendations
        careers = []
        for suggestion in ai_suggestions.split('\n\n'):
            if suggestion.strip():
                # Extract title, description, and percentage using basic parsing
                lines = suggestion.strip().split('\n')
                if len(lines) >= 3:
                    title = lines[0].replace('Title:', '').strip()
                    desc = lines[1].replace('Description:', '').strip()
                    # Extract percentage from text (assuming it's mentioned in the description)
                    match = 85  # Default fallback
                    for line in lines:
                        if 'match' in line.lower() and '%' in line:
                            try:
                                match = int(''.join(filter(str.isdigit, line)))
                            except ValueError:
                                pass
                    
                    careers.append({
                        "title": title,
                        "description": desc,
                        "match_percentage": match,
                        "roadmap_available": True
                    })

        if not careers:
            return jsonify({"error": "Failed to generate career recommendations"}), 500

        return jsonify({"recommended_careers": careers}), 200
        
    except Exception as e:
        print(f"Error generating recommendations: {str(e)}")  # Debug logging
        return jsonify({"error": "Failed to generate career recommendations"}), 500
    

    

# Roadmap Blueprint Routes
@app.route("/roadmap/generate", methods=['POST'])
@jwt_required()
def generate_roadmap():
    try:
        data = request.get_json()
        required_fields = ['career_title', 'knowledge_level', 'timeline', 'goal']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing field: {field}"}), 422

        if not OPENAI_API_KEY:
            return jsonify({"error": "OpenAI API key is not configured"}), 500

        # Create prompt for roadmap generation
        prompt = f"""Create a structured learning roadmap for a career as {data['career_title']}, considering the learner's knowledge level: {data['knowledge_level']}, timeline: {data['timeline']}, and career goal: {data['goal']}.
          Present the roadmap in clear sections with headings.
            Include:

            Key skills to master

            A week-by-week breakdown of learning topics

            Practical project ideas for hands-on practice

            Industry-standard tools and technologies to learn

            Recommended online courses (with links)

            Relevant certifications (if applicable)"""

        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a career roadmap expert providing detailed learning paths."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=2000
        )

        roadmap_content = response.choices[0].message.content

        # Store roadmap in user's profile
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user.profile_data:
            user.profile_data = {}
        
        if 'roadmaps' not in user.profile_data:
            user.profile_data['roadmaps'] = []

        new_roadmap = {
            'id': len(user.profile_data['roadmaps']) + 1,
            'career_title': data['career_title'],
            'knowledge_level': data['knowledge_level'],
            'timeline': data['timeline'],
            'goal': data['goal'],
            'content': roadmap_content,
            'created_at': datetime.datetime.now().isoformat()
        }

        roadmaps = user.profile_data.get('roadmaps', [])
        roadmaps = roadmaps + [new_roadmap]  # <- key fix
        user.profile_data['roadmaps'] = roadmaps
        print("Before commit:", [i['id'] for i in user.profile_data['roadmaps']])
        db.session.commit()
        print("After commit:", [i['id'] for i in user.profile_data['roadmaps']])

        return jsonify({
            "message": "Roadmap generated successfully",
            "roadmap": new_roadmap
        }), 200

    except Exception as e:
        print(f"Error generating roadmap: {str(e)}")
        return jsonify({"error": "Failed to generate roadmap"}), 500
    


@app.route("/roadmap/history", methods=['GET'])
@jwt_required()
def get_roadmap_history():
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)
        
        if not user.profile_data or 'roadmaps' not in user.profile_data:
            return jsonify({"roadmaps": []}), 200

        return jsonify({"roadmaps": user.profile_data['roadmaps']}), 200

    except Exception as e:
        print(f"Error fetching roadmap history: {str(e)}")
        return jsonify({"error": "Failed to fetch roadmap history due to server error, try again later"}), 500


@app.route("/roadmap/delete/<int:roadmap_id>", methods=['DELETE', 'OPTIONS'])
@jwt_required() 
def delete_roadmap(roadmap_id):
    if request.method == "OPTIONS":
        return jsonify({"message": "CORS preflight passed"}), 200
    try:
        current_user_id = int(get_jwt_identity())
        user = User.query.get(current_user_id)

        if not user.profile_data or 'roadmaps' not in user.profile_data:
            return jsonify({"error": "No roadmaps found"}), 404

        roadmaps = user.profile_data['roadmaps']
        updated_roadmaps = [r for r in roadmaps if r['id'] != roadmap_id]

        if len(updated_roadmaps) == len(roadmaps):
            return jsonify({"error": "Roadmap not found"}), 404

        # Reassign so SQLAlchemy tracks changes
        user.profile_data['roadmaps'] = updated_roadmaps
        db.session.commit()

        return jsonify({"message": "Roadmap deleted successfully"}), 200
    except Exception as e:
        print(f"Error deleting roadmap: {str(e)}")
        return jsonify({"error": "Failed to delete roadmap"}), 500


if __name__ == "__main__":
    app.run(debug=True)