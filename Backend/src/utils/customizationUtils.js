const CustomizationResponse = require('../models/customizationResponse');
const CustomizationRequest = require('../models/customizationRequest');
const Customer = require('../models/customer');
const Artist = require('../models/artist');

const autoDeclinePendingResponses = async (requestId) => {
    try {
        const result = await CustomizationResponse.update(
            { status: 'DECLINED' },
            { 
                where: { 
                    requestId: requestId,
                    status: 'PENDING'
                }
            }
        );
        return result[0];
    } catch (error) {
        console.error('Error auto-declining pending responses:', error);
        throw error;
    }
};

const enhanceResponsesWithRequestData = async (responses) => {
    if (!responses.length) return responses;
    const requestIds = [...new Set(responses.map(r => r.requestId))];
    const customizationRequests = await CustomizationRequest.findAll({
        where: { requestId: requestIds },
        include: [
            {
                model: Customer,
                attributes: ['username', 'customerId']
            }
        ]
    });
    const requestMap = {};
    customizationRequests.forEach(req => {
        requestMap[req.requestId] = req;
    });
    responses.forEach(response => {
        response.CustomizationRequest = requestMap[response.requestId];
    });
    
    return responses;
};
const findAndDeclineOrphanedResponses = async (responses) => {
    const responsesToUpdate = [];
    
    for (const response of responses) {
        if (response.status === 'PENDING' && 
            response.CustomizationRequest && 
            response.CustomizationRequest.status === 'CLOSED') {
            responsesToUpdate.push(response.responseId);
        }
    }
    
    if (responsesToUpdate.length > 0) {
        await CustomizationResponse.update(
            { status: 'DECLINED' },
            { where: { responseId: responsesToUpdate } }
        );
    }
    
    return responsesToUpdate;
};

const getArtistResponsesEnhanced = async (artistId) => {
    try {
        let responses = await CustomizationResponse.findAll({
            where: { artistId },
            include: [
                {
                    model: CustomizationRequest,
                    attributes: ['title', 'image', 'budget', 'requestDescription', 'status', 'customerId'],
                    required: false, 
                    include: [
                        {
                            model: Customer,
                            attributes: ['username'],
                            required: false
                        }
                    ]
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        let associationWorking = responses.length > 0 && !!responses[0].CustomizationRequest;
        let autoDeclinedCount = 0;
        if (responses.length > 0 && !associationWorking) {
            responses = await enhanceResponsesWithRequestData(responses);
        }
        const orphanedResponseIds = await findAndDeclineOrphanedResponses(responses);
        autoDeclinedCount = orphanedResponseIds.length;
        if (autoDeclinedCount > 0) {
            responses = await CustomizationResponse.findAll({
                where: { artistId },
                include: [
                    {
                        model: CustomizationRequest,
                        attributes: ['title', 'image', 'budget', 'requestDescription', 'status', 'customerId'],
                        required: false,
                        include: [
                            {
                                model: Customer,
                                attributes: ['username'],
                                required: false
                            }
                        ]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });
            if (responses.length > 0 && !responses[0].CustomizationRequest) {
                responses = await enhanceResponsesWithRequestData(responses);
            }
        }

        return {
            responses,
            autoDeclinedCount,
            associationWorking
        };

    } catch (error) {
        console.error('Error in getArtistResponsesEnhanced:', error);
        throw error;
    }
};
const getCustomerResponsesEnhanced = async (customerId) => {
    try {
        const requests = await CustomizationRequest.findAll({ 
            where: { customerId },
            attributes: ['requestId']
        });
        
        if (!requests.length) {
            return [];
        }
        
        const requestIds = requests.map(request => request.requestId);
        let responses = await CustomizationResponse.findAll({
            where: { requestId: requestIds },
            include: [
                {
                    model: Artist,
                    attributes: ['username', 'artistId'],
                    required: false
                },
                {
                    model: CustomizationRequest,
                    attributes: ['title', 'image', 'budget', 'requestDescription'],
                    required: false
                }
            ],
            order: [['createdAt', 'DESC']]
        });
        if (responses.length > 0 && !responses[0].Artist) {
            const artistIds = [...new Set(responses.map(r => r.artistId))];
            const artists = await Artist.findAll({
                where: { artistId: artistIds },
                attributes: ['artistId', 'username']
            });
            
            const artistMap = {};
            artists.forEach(artist => {
                artistMap[artist.artistId] = artist;
            });
            
            responses.forEach(response => {
                response.Artist = artistMap[response.artistId];
            });
        }
        if (responses.length > 0 && !responses[0].CustomizationRequest) {
            const requestsData = await CustomizationRequest.findAll({
                where: { requestId: requestIds },
                attributes: ['requestId', 'title', 'image', 'budget', 'requestDescription']
            });
            
            const requestMap = {};
            requestsData.forEach(req => {
                requestMap[req.requestId] = req;
            });
            
            responses.forEach(response => {
                response.CustomizationRequest = requestMap[response.requestId];
            });
        }

        return responses;

    } catch (error) {
        console.error('Error in getCustomerResponsesEnhanced:', error);
        throw error;
    }
};

module.exports = {
    autoDeclinePendingResponses,
    enhanceResponsesWithRequestData,
    findAndDeclineOrphanedResponses,
    getArtistResponsesEnhanced,
    getCustomerResponsesEnhanced
};
