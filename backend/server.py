from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
import requests
from bs4 import BeautifulSoup
import re
import json
from urllib.parse import urljoin
import time


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")


# ==================== MODELS ====================

class StatusCheck(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class StatusCheckCreate(BaseModel):
    client_name: str

class SeriesInfoRequest(BaseModel):
    url: str

class SeriesInfoResponse(BaseModel):
    title: str
    series_id: str
    thumbnail_url: Optional[str] = None
    author: Optional[str] = None
    description: Optional[str] = None

class Chapter(BaseModel):
    chapter_id: str
    title: str
    url: str
    thumbnail_url: Optional[str] = None
    episode_no: Optional[int] = None

class ChaptersRequest(BaseModel):
    url: str

class ChaptersResponse(BaseModel):
    chapters: List[Chapter]
    total_count: int

class ChapterImagesRequest(BaseModel):
    chapter_url: str

class ChapterImagesResponse(BaseModel):
    images: List[str]
    chapter_title: str


# ==================== UTILITY FUNCTIONS ====================

def get_webtoon_headers(referer=None):
    """Get headers for webtoon requests"""
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Cache-Control': 'max-age=0'
    }
    if referer:
        headers['Referer'] = referer
    return headers

def generate_series_id(url: str) -> str:
    """Generate a unique series ID from URL"""
    # Extract title_no from URL
    match = re.search(r'title_no=(\d+)', url)
    if match:
        return f"series_{match.group(1)}"
    return f"series_{hash(url)}"

def generate_chapter_id(url: str) -> str:
    """Generate a unique chapter ID from URL"""
    # Extract episode_no from URL
    match = re.search(r'episode_no=(\d+)', url)
    if match:
        return f"chapter_{match.group(1)}"
    return f"chapter_{hash(url)}"


# ==================== API ROUTES ====================

@api_router.get("/")
async def root():
    return {"message": "Webtoon Downloader API"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.dict()
    status_obj = StatusCheck(**status_dict)
    _ = await db.status_checks.insert_one(status_obj.dict())
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find().to_list(1000)
    return [StatusCheck(**status_check) for status_check in status_checks]

@api_router.post("/webtoon/series-info", response_model=SeriesInfoResponse)
async def get_series_info(request: SeriesInfoRequest):
    """Get series information from URL"""
    try:
        response = requests.get(request.url, headers=get_webtoon_headers(), timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract series title
        series_title_elem = soup.select_one('h1.subj')
        series_title = series_title_elem.text.strip() if series_title_elem else "Unknown Series"
        
        # Extract thumbnail
        thumbnail_elem = soup.select_one('div.detail_header img')
        thumbnail_url = thumbnail_elem.get('src') if thumbnail_elem else None
        
        # Extract author
        author_elem = soup.select_one('h2.author')
        author = author_elem.text.strip() if author_elem else None
        
        # Extract description
        desc_elem = soup.select_one('p.summary')
        description = desc_elem.text.strip() if desc_elem else None
        
        series_id = generate_series_id(request.url)
        
        return SeriesInfoResponse(
            title=series_title,
            series_id=series_id,
            thumbnail_url=thumbnail_url,
            author=author,
            description=description
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch series info: {str(e)}")

@api_router.post("/webtoon/chapters", response_model=ChaptersResponse)
async def get_chapters(request: ChaptersRequest):
    """Get all chapters from series URL"""
    try:
        chapters = []
        
        # Parse base URL
        base_url = request.url.split('&page=')[0]
        if '?' not in base_url:
            base_url += '?'
        if not base_url.endswith('?') and not base_url.endswith('&'):
            base_url += '&'
        
        # Find last page
        try:
            response = requests.get(
                f"{base_url}page=999999",
                headers=get_webtoon_headers(),
                timeout=30
            )
            response.raise_for_status()
            soup = BeautifulSoup(response.text, 'html.parser')
            
            paginate = soup.find('div', class_='paginate')
            last_page = 1
            if paginate:
                page_numbers = [int(span.text) for span in paginate.find_all('span', class_='on')]
                if page_numbers:
                    last_page = max(page_numbers)
        except Exception:
            last_page = 10
        
        # Get chapters from each page
        for page in range(1, last_page + 1):
            try:
                response = requests.get(
                    f"{base_url}page={page}",
                    headers=get_webtoon_headers(),
                    timeout=30
                )
                response.raise_for_status()
                soup = BeautifulSoup(response.text, 'html.parser')
                
                chapter_list = soup.find('ul', id='_listUl')
                if chapter_list:
                    for item in chapter_list.find_all('li'):
                        link = item.find('a', href=True)
                        title_elem = item.find('span', class_='subj')
                        thumb_elem = item.find('img', class_='_episodeImg')
                        
                        if link and title_elem:
                            chapter_url = link['href']
                            if not chapter_url.startswith('http'):
                                chapter_url = urljoin('https://www.webtoons.com', chapter_url)
                            
                            title_text = title_elem.get_text(strip=True)
                            thumb_url = thumb_elem.get('src') if thumb_elem else None
                            
                            # Extract episode number
                            ep_match = re.search(r'episode_no=(\d+)', chapter_url)
                            episode_no = int(ep_match.group(1)) if ep_match else None
                            
                            if title_text:
                                chapters.append(Chapter(
                                    chapter_id=generate_chapter_id(chapter_url),
                                    title=title_text,
                                    url=chapter_url,
                                    thumbnail_url=thumb_url,
                                    episode_no=episode_no
                                ))
                
                time.sleep(0.5)  # Rate limiting
                
            except Exception as e:
                logging.warning(f"Error on page {page}: {str(e)}")
        
        # Reverse to get chronological order
        chapters.reverse()
        
        if not chapters:
            raise HTTPException(status_code=404, detail="No chapters found")
        
        return ChaptersResponse(
            chapters=chapters,
            total_count=len(chapters)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chapters: {str(e)}")

@api_router.post("/webtoon/chapter-images", response_model=ChapterImagesResponse)
async def get_chapter_images(request: ChapterImagesRequest):
    """Extract image URLs from chapter page"""
    try:
        response = requests.get(request.chapter_url, headers=get_webtoon_headers(), timeout=30)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract chapter title
        title_elem = soup.select_one('h1.subj_episode')
        chapter_title = title_elem.text.strip() if title_elem else "Unknown Chapter"
        
        image_urls = []
        
        # Method 1: Look for image list div
        image_list = soup.find('div', id='_imageList')
        if image_list:
            images = image_list.find_all('img', class_='_images')
            for img in images:
                if 'data-url' in img.attrs:
                    image_urls.append(img['data-url'])
        
        # Method 2: Parse from JavaScript
        if not image_urls:
            scripts = soup.find_all('script')
            for script in scripts:
                if script.string and 'imageData' in script.string:
                    try:
                        match = re.search(r'var\s+imageData\s*=\s*(\[.*?\]);', script.string, re.DOTALL)
                        if match:
                            image_data = json.loads(match.group(1))
                            for item in image_data:
                                if 'url' in item:
                                    image_urls.append(item['url'])
                            if image_urls:
                                break
                    except:
                        continue
        
        # Method 3: Look for viewer images
        if not image_urls:
            viewer = soup.find('div', id='_viewerBox')
            if viewer:
                for img in viewer.find_all('img'):
                    src = img.get('data-url') or img.get('data-src') or img.get('src')
                    if src and not any(x in src.lower() for x in ['advertisement', 'blank', 'loading']):
                        image_urls.append(src)
        
        if not image_urls:
            raise HTTPException(status_code=404, detail="No images found in chapter")
        
        return ChapterImagesResponse(
            images=image_urls,
            chapter_title=chapter_title
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to extract images: {str(e)}")

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
